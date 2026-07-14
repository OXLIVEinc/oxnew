import { and, asc, desc, eq, gt, ilike, or, sql } from "drizzle-orm";
import { db } from "../db/client";
import * as schema from "../../../../shared/schema";
import { OrderItem } from "../../../../shared/schema";
import { initializeTransaction } from "../lib/paystack";
import { nextOrderReference, nextHotelReference, nextTransferCode } from "../lib/ids";
import { createTicketQr } from "../lib/qr/create-ticket-qr";
import { distanceKm } from "../lib/geocode";
import { sendMessage, sendImageMessage } from "../bot/messenger";
import { HotelOrderWithDetails } from "../../../../shared/schema";
import { getTableColumns } from "drizzle-orm";


export type EventRow = schema.Event;
export type TicketTierRow = schema.TicketTier;
export type TicketOrderRow = schema.TicketOrder;
export type HotelOrderRow = schema.HotelOrder;
export type TicketRow = schema.Ticket;
export type TicketTransferRow = schema.TicketTransfer;
export type HotelPartnerRow = schema.HotelPartner;

export const PAGE_SIZE = 10;

export class TierUnavailableError extends Error {}

export interface Page<T> {
  items: T[];
  hasMore: boolean;
  nextOffset: number;
}

// ---------------------------------------------------------------------------
// PROFILES
// ---------------------------------------------------------------------------

/**
 * @param waName - the buyer's WhatsApp display name, if the inbound
 *                 webhook included one. Used as a fallback greeting name
 *                 for anyone who hasn't upgraded to the web app (and so
 *                 has no `displayName` of their own yet), and backfilled
 *                 onto the profile the first time we see it so future
 *                 turns don't need the webhook payload to know it.
 */
export async function getOrCreateProfile(phone: string, waName?: string | null): Promise<schema.Profile> {
  const existing = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.phone, phone))
    .limit(1);

  if (existing[0]) {
    if (!existing[0].displayName && waName) {
      const [updated] = await db
        .update(schema.profiles)
        .set({ displayName: waName, updatedAt: new Date() })
        .where(eq(schema.profiles.id, existing[0].id))
        .returning();
      return updated;
    }
    return existing[0];
  }

  const [created] = await db
    .insert(schema.profiles)
    .values({ phone, displayName: waName || null })
    .returning();
  return created;
}



export async function findPendingHotelOrders(hotelId: string) {
  return db
    .select({
      id: schema.hotelOrders.id,
      reference: schema.hotelOrders.reference,
      checkIn: schema.hotelOrders.checkIn,
      checkOut: schema.hotelOrders.checkOut,
      guests: schema.hotelOrders.guests,
      amount: schema.hotelOrders.amount,
      currency: schema.hotelOrders.currency,
      roomType: schema.hotelRoomTypes.name,
      guestName: schema.profiles.displayName,
      guestPhone: schema.profiles.phone,
    })
    .from(schema.hotelOrders)
    .innerJoin(
      schema.hotelRoomTypes,
      eq(schema.hotelOrders.roomTypeId, schema.hotelRoomTypes.id)
    )
    .innerJoin(
      schema.profiles,
      eq(schema.hotelOrders.userId, schema.profiles.id)
    )
    .where(
      and(
        eq(schema.hotelOrders.hotelId, hotelId),
        eq(schema.hotelOrders.status, "paid")
      )
    )
    .orderBy(asc(schema.hotelOrders.paidAt));
}


export async function getProfileByUserId(userId: string): Promise<schema.Profile | null> {
  const [profile] = await db
    .select()
    .from(schema.profiles)
    .where(eq(schema.profiles.userId, userId))
    .limit(1);

  return profile ?? null;
}

// ---------------------------------------------------------------------------
// EVENTS / TIERS
//
// Buyers should only ever see events that are (a) approved by an admin/
// organizer, and (b) still upcoming (hasn't started yet). Past or
// not-yet-approved events never show up in search/browse.
// ---------------------------------------------------------------------------

function approvedUpcomingFilter() {
  return and(
    eq(schema.events.status, "active"),
    eq(schema.events.approvalStatus, "approved"),
    gt(schema.events.startsAt, new Date())
  );
}

export async function findEventByCode(code: string): Promise<EventRow | null> {
  const rows = await db
    .select()
    .from(schema.events)
    .where(eq(schema.events.eventCode, code.trim().toUpperCase()))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Search upcoming, approved events by name/venue/code. Paginated 10 at a
 * time — callers show a "more" prompt when `hasMore` is true and re-call
 * with the returned `nextOffset` rather than loading everything up front.
 */
export async function searchEvents(term: string, offset = 0, limit = PAGE_SIZE): Promise<Page<EventRow>> {
  const like = `%${term.trim().toLowerCase()}%`;
  const rows = await db
    .select()
    .from(schema.events)
    .where(
      and(
        approvedUpcomingFilter(),
        or(
          ilike(schema.events.title, like),
          ilike(schema.events.address, like),
          ilike(schema.events.eventCode, like)
        )
      )
    )
    .orderBy(asc(schema.events.startsAt))
    .limit(limit + 1)
    .offset(offset);

  return paginate(rows, limit, offset);
}

/** Browse without a search term: just the next page of upcoming approved events. */
export async function listUpcomingEvents(offset = 0, limit = PAGE_SIZE): Promise<Page<EventRow>> {
  const rows = await db
    .select()
    .from(schema.events)
    .where(approvedUpcomingFilter())
    .orderBy(asc(schema.events.startsAt))
    .limit(limit + 1)
    .offset(offset);

  return paginate(rows, limit, offset);
}

export async function getEventById(id: string): Promise<EventRow | null> {
  const rows = await db.select().from(schema.events).where(eq(schema.events.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getTiersForEvent(eventId: string): Promise<TicketTierRow[]> {
  return db
    .select()
    .from(schema.ticketTiers)
    .where(eq(schema.ticketTiers.eventId, eventId))
    .orderBy(schema.ticketTiers.createdAt);
}

/** A limited tier is sold out once `sold` reaches `quantity`; unlimited tiers are never sold out. */
export function isTierSoldOut(tier: TicketTierRow): boolean {
  return !tier.isUnlimited && tier.sold >= (tier.quantity ?? 0);
}

/** Remaining stock for a tier, or `null` for unlimited tiers (no cap to report). */
export function tierRemaining(tier: TicketTierRow): number | null {
  if (tier.isUnlimited) return null;
  return Math.max(0, (tier.quantity ?? 0) - tier.sold);
}

/**
 * Every event needs at least one ticket tier — paid or free (isPaid just
 * flags whether checkout collects real money; a "free" event still runs
 * through the exact same order → registration pipeline with amount 0,
 * which the frontend is responsible for treating accordingly).
 * Call this right after creating an event if the organizer didn't define
 * their own tiers; it's a no-op if tiers already exist. The fallback tier
 * is unlimited so a missing/forgotten tier setup never blocks admission.
 */
export async function ensureDefaultTicketTier(eventId: string): Promise<TicketTierRow> {
  const existing = await getTiersForEvent(eventId);
  if (existing.length > 0) return existing[0];

  const [tier] = await db
    .insert(schema.ticketTiers)
    .values({
      eventId,
      name: "General Admission",
      price: "0",
      isUnlimited: true,
    })
    .returning();
  return tier;
}

export interface CreateTicketTierInput {
  eventId: string;
  name: string;
  description?: string;
  /** Whether the parent event is paid — governs price/quantity validation rules. */
  eventIsPaid: boolean;
  price?: number;
  quantityType: "limited" | "unlimited";
  quantity?: number;
}

/**
 * Encapsulates the ticket-tier creation rules:
 *  - name is required; description optional.
 *  - price is required (>0) for paid events; free events default to 0.
 *  - quantityType is required; "limited" additionally requires a positive quantity.
 */
export async function createTicketTier(input: CreateTicketTierInput): Promise<TicketTierRow> {
  const name = input.name.trim();
  if (!name) throw new Error("Ticket tier name is required");

  let price = input.price ?? 0;
  if (input.eventIsPaid) {
    if (!price || price <= 0) {
      throw new Error("Paid events require a ticket tier price greater than ₦0");
    }
  } else {
    price = 0; // free events always default to ₦0, ignoring any price entered
  }

  const isUnlimited = input.quantityType === "unlimited";
  if (!isUnlimited && (!input.quantity || input.quantity <= 0)) {
    throw new Error("Quantity is required for a limited ticket tier");
  }

  const [tier] = await db
    .insert(schema.ticketTiers)
    .values({
      eventId: input.eventId,
      name,
      description: input.description,
      price: String(price),
      isUnlimited,
      quantity: isUnlimited ? null : input.quantity,
    })
    .returning();
  return tier;
}

// ---------------------------------------------------------------------------
// TICKET ORDERS  (created right after qty is chosen — no in-chat name step)
// ---------------------------------------------------------------------------

export interface CreateTicketOrderInput {
  phone: string;
  eventId: string;
  tierId: string;
  quantity: number;
  unitPrice: number;
}

export async function createTicketOrder(input: CreateTicketOrderInput): Promise<TicketOrderRow> {
  const tierRows = await db.select().from(schema.ticketTiers).where(eq(schema.ticketTiers.id, input.tierId)).limit(1);
  const tier = tierRows[0];
  if (!tier) throw new Error("Ticket tier not found");
  if (!tier.isUnlimited) {
    const remaining = tierRemaining(tier)!;
    if (remaining <= 0) throw new TierUnavailableError("This ticket tier is sold out.");
    if (input.quantity > remaining) {
      throw new TierUnavailableError(`Only ${remaining} ticket(s) left in this tier.`);
    }
  }
 
  const profile = await getOrCreateProfile(input.phone);

  const serviceFeeRate = 0.02;

const subtotal = input.unitPrice * input.quantity;
const serviceFee = subtotal * serviceFeeRate;
const amount = subtotal + serviceFee;
  const reference = nextOrderReference("OX-ORD");

  const [order] = await db
    .insert(schema.ticketOrders)
    .values({
      reference,
      userId: profile.id,
      phone: input.phone,
      eventId: input.eventId,
      tierId: input.tierId,
      quantity: input.quantity,
      unitPrice: String(input.unitPrice),
      subtotal: String(subtotal),
      amount: String(amount),
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    })
    .returning();

  return order;
}

export async function getTicketOrderById(id: string): Promise<TicketOrderRow | null> {
  const rows = await db.select().from(schema.ticketOrders).where(eq(schema.ticketOrders.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function findTicketOrderByReference(reference: string): Promise<TicketOrderRow | null> {
  const rows = await db
    .select()
    .from(schema.ticketOrders)
    .where(eq(schema.ticketOrders.reference, reference))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Called by the checkout view once the buyer has entered name + email for
 * each seat. Validates the count, then opens a Paystack transaction and
 * stores the payment link on the order. Free events (amount === 0) still
 * go through this same call — the frontend/checkout view is responsible
 * for skipping the actual payment redirect when there's nothing to charge.
 */
export async function submitOrderItems(orderId: string, items: OrderItem[]): Promise<TicketOrderRow> {
  const order = await getTicketOrderById(orderId);
  if (!order) throw new Error("Order not found");
  if (order.status !== "pending") throw new Error(`Order is already ${order.status}`);
  if (!items || items.length !== order.quantity) {
    throw new Error(`Expected ${order.quantity} attendee(s), got ${items?.length ?? 0}`);
  }

  const profileRows = await db.select().from(schema.profiles).where(eq(schema.profiles.id, order.userId)).limit(1);
  const buyerEmail = items[0]?.attendeeEmail || profileRows[0]?.email || `${order.phone}@guest.ox.app`;

  const payment = await initializeTransaction({
    email: buyerEmail,
    amountKobo: Math.round(Number(order.amount) * 100),
    reference: order.reference,
    metadata: { phone: order.phone, kind: "event", orderId: order.id },
  });

  const [updated] = await db
    .update(schema.ticketOrders)
    .set({
      items,
      status: "awaiting_payment",
      accessCode: payment.accessCode,
      authorizationUrl: payment.authorizationUrl,
      paystackReference: payment.reference,
      updatedAt: new Date(),
    })
    .where(eq(schema.ticketOrders.id, orderId))
    .returning();

  return updated;
}

/**
 * Free-event counterpart to submitOrderItems — skips Paystack entirely
 * (there's nothing to charge) and just records the attendee list. The
 * caller is responsible for then completing the order (see
 * payments.completeTicketOrderPayment, called with amountKobo 0), the
 * same idempotent pipeline a real webhook would trigger.
 */
export async function submitOrderItemsFree(orderId: string, items: OrderItem[]): Promise<TicketOrderRow> {
  const order = await getTicketOrderById(orderId);
  if (!order) throw new Error("Order not found");
  if (order.status !== "pending") throw new Error(`Order is already ${order.status}`);
  if (Number(order.amount) !== 0) throw new Error("This order is not free");
  if (!items || items.length !== order.quantity) {
    throw new Error(`Expected ${order.quantity} attendee(s), got ${items?.length ?? 0}`);
  }

  const [updated] = await db
    .update(schema.ticketOrders)
    .set({ items, updatedAt: new Date() })
    .where(eq(schema.ticketOrders.id, orderId))
    .returning();

  return updated;
}

export async function markTicketOrderPaid(orderId: string): Promise<TicketOrderRow> {
  const [updated] = await db
    .update(schema.ticketOrders)
    .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.ticketOrders.id, orderId))
    .returning();
  return updated;
}

/**
 * Generates real ticket assets (signed QR + branded card image, uploaded
 * and publicly reachable) for every attendee on a paid order, then writes
 * the tickets AND fires an event_registrations row per attendee — every
 * completed ticket order also registers the buyer for the event.
 */
export async function createTicketsForOrder(order: TicketOrderRow): Promise<TicketRow[]> {
  const items = (order.items || []) as OrderItem[];
  if (items.length === 0) return [];

  const [event, tier, buyerProfile] = await Promise.all([
    getEventById(order.eventId),
    db.select().from(schema.ticketTiers).where(eq(schema.ticketTiers.id, order.tierId)).limit(1).then((r) => r[0]),
    getOrCreateProfile(order.phone),
  ]);
  if (!event) throw new Error("Event not found for order");

  const tickets: TicketRow[] = [];

  for (const item of items) {
    // Insert first (without a real qrCode yet) so we have a stable ticket
    // id to embed in the signed QR payload, then patch qrCode/checkInCode.
    const [placeholder] = await db
      .insert(schema.tickets)
      .values({
        orderId: order.id,
        eventId: order.eventId,
        tierId: order.tierId,
        userId: buyerProfile.id,
        attendeeName: item.attendeeName,
        attendeeEmail: item.attendeeEmail,
        qrCode: "",
        checkInCode: "",
        status: "valid" as const,
      })
      .returning();

    const { checkInCode, qrCode } = await createTicketQr({
      ticketId: placeholder.id,
      eventId: event.id,
      buyerName: item.attendeeName,
      ticketTier: tier?.name ?? "General Admission",
      eventName: event.title,
      eventStartsAt: event.startsAt,
      eventEndsAt: event.endsAt,
      address: event.address,
      banner: event.backgroundImageUrl,
    });

    const [finalTicket] = await db
      .update(schema.tickets)
      .set({ checkInCode, qrCode })
      .where(eq(schema.tickets.id, placeholder.id))
      .returning();

    tickets.push(finalTicket);
  }

  // Limited tiers track stock via `sold` — unlimited tiers never need it,
  // but incrementing it anyway is harmless (it just stays informational).
  await db
    .update(schema.ticketTiers)
    .set({ sold: sql`${schema.ticketTiers.sold} + ${tickets.length}` })
    .where(eq(schema.ticketTiers.id, order.tierId));

  // One registration per attendee. Unique on (userId, eventId) — an
  // attendee registering twice for the same event (e.g. buying a second
  // ticket) is fine at the order/ticket level, but only counts once here.
  await db
    .insert(schema.eventRegistrations)
    .values({
      userId: buyerProfile.id,
      eventId: order.eventId,
      ticketTierId: order.tierId,
    })
    .onConflictDoNothing();

  return tickets;
}

export async function getTicketsForOrder(orderId: string): Promise<TicketRow[]> {
  return db.select().from(schema.tickets).where(eq(schema.tickets.orderId, orderId));
}

// Post-purchase engagement markers — each delayed queue job checks/sets its
// own column so retried/duplicate jobs never send the same nudge twice.

export async function markTicketsDelivered(orderId: string): Promise<void> {
  await db.update(schema.ticketOrders).set({ ticketsDeliveredAt: new Date() }).where(eq(schema.ticketOrders.id, orderId));
}

export async function markHotelUpsellSent(orderId: string): Promise<void> {
  await db.update(schema.ticketOrders).set({ hotelUpsellSentAt: new Date() }).where(eq(schema.ticketOrders.id, orderId));
}

export async function markReferralPushSent(orderId: string): Promise<void> {
  await db.update(schema.ticketOrders).set({ referralPushSentAt: new Date() }).where(eq(schema.ticketOrders.id, orderId));
}

export async function markPreEventReminderSent(orderId: string): Promise<void> {
  await db.update(schema.ticketOrders).set({ preEventReminderSentAt: new Date() }).where(eq(schema.ticketOrders.id, orderId));
}

// ---------------------------------------------------------------------------
// TICKETS
// ---------------------------------------------------------------------------

export async function getTicketById(id: string): Promise<TicketRow | null> {
  const rows = await db.select().from(schema.tickets).where(eq(schema.tickets.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getTransferableTicketsWithDetails(phone: string): Promise<
  { id: string; checkInCode: string; eventName: string; tierLabel: string }[]
> {
  const profile = await getOrCreateProfile(phone);
  return db
    .select({
      id: schema.tickets.id,
      checkInCode: schema.tickets.checkInCode,
      eventName: schema.events.title,
      tierLabel: schema.ticketTiers.name,
    })
    .from(schema.tickets)
    .innerJoin(schema.events, eq(schema.tickets.eventId, schema.events.id))
    .innerJoin(schema.ticketTiers, eq(schema.tickets.tierId, schema.ticketTiers.id))
    .where(and(eq(schema.tickets.userId, profile.id), eq(schema.tickets.status, "valid")));
}

export async function getTicketWithDetails(id: string): Promise<
  { id: string; status: string; eventId: string; tierId: string; orderId: string | null; eventName: string; tierLabel: string } | null
> {
  const rows = await db
    .select({
      id: schema.tickets.id,
      status: schema.tickets.status,
      eventId: schema.tickets.eventId,
      tierId: schema.tickets.tierId,
      orderId: schema.tickets.orderId,
      eventName: schema.events.title,
      tierLabel: schema.ticketTiers.name,
    })
    .from(schema.tickets)
    .innerJoin(schema.events, eq(schema.tickets.eventId, schema.events.id))
    .innerJoin(schema.ticketTiers, eq(schema.tickets.tierId, schema.ticketTiers.id))
    .where(eq(schema.tickets.id, id))
    .limit(1);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// HOTELS
// ---------------------------------------------------------------------------

function approvedHotelFilter() {
  return eq(schema.hotelPartners.approvalStatus, "approved");
}

export async function searchHotels(city: string, offset = 0, limit = PAGE_SIZE): Promise<Page<HotelPartnerRow>> {
  const rows = await db
    .select()
    .from(schema.hotelPartners)
    .where(and(approvedHotelFilter(), ilike(schema.hotelPartners.city, `%${city.trim()}%`)))
    .orderBy(asc(schema.hotelPartners.name))
    .limit(limit + 1)
    .offset(offset);

  return paginate(rows, limit, offset);
}

export async function getHotelById(id: string): Promise<HotelPartnerRow | null> {
  const rows = await db.select().from(schema.hotelPartners).where(eq(schema.hotelPartners.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getRoomTypesForHotel(hotelId: string): Promise<schema.HotelRoomType[]> {
  return db
    .select()
    .from(schema.hotelRoomTypes)
    .where(eq(schema.hotelRoomTypes.hotelId, hotelId))
    .orderBy(schema.hotelRoomTypes.sortOrder);
}

/**
 * Recommends approved hotels near an event, sorted by straight-line
 * distance using the event's and each hotel's lat/lng. Used for the
 * post-purchase hotel upsell nudge.
 */
export async function recommendHotelsNearEvent(
  eventId: string,
  limit = 3
): Promise<{ id: string; name: string; pricePerNight: number; distanceKm: number }[]> {
  const event = await getEventById(eventId);
  if (!event) return [];

  const hotels = await db.select().from(schema.hotelPartners).where(approvedHotelFilter());
  const eventPoint = { lat: Number(event.locationLat), lng: Number(event.locationLng) };

  const withDistance = await Promise.all(
    hotels.map(async (hotel) => {
      const rooms = await getRoomTypesForHotel(hotel.id);
      const cheapest = rooms.reduce<number | null>((min, r) => {
        const price = Number(r.pricePerNight);
        return min === null || price < min ? price : min;
      }, null);

      return {
        id: hotel.id,
        name: hotel.name,
        pricePerNight: cheapest ?? 0,
        distanceKm: distanceKm(eventPoint, { lat: Number(hotel.locationLat), lng: Number(hotel.locationLng) }),
      };
    })
  );

  return withDistance
    .filter((h) => h.pricePerNight > 0)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// HOTEL ORDERS
// ---------------------------------------------------------------------------

export interface CreateHotelOrderInput {
  phone: string;
  hotelId: string;
  roomTypeId: string;
  roomTypeName: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  pricePerNight: number;
}

// Fire-and-forget hooks so the Hotel Partner Dashboard reflects a booking
// change in realtime no matter which channel (WhatsApp bot or dashboard)
// caused it. Imported lazily to avoid any load-order coupling with the
// rest of the bot's data layer; a notification failure here must never
// break the booking flow that triggered it.
async function publishHotelOrderEvent(
  kind: "created" | "paid" | "confirmed" | "declined" | "cancelled",
  order: HotelOrderRow
): Promise<void> {
  try {
    const events = await import("@/modules/hotel/hotel.events.js");
    if (kind === "created") await events.notifyBookingCreated(order as never);
    if (kind === "paid") await events.notifyBookingPaid(order as never);
    if (kind === "confirmed") await events.notifyBookingConfirmed(order as never);
    if (kind === "declined") await events.notifyBookingDeclined(order as never);
    if (kind === "cancelled") await events.notifyBookingCancelled(order as never);
  } catch (err) {
    console.error("[whatsapp/db] failed to publish hotel order event", kind, err);
  }
}

export async function createHotelOrder(input: CreateHotelOrderInput): Promise<HotelOrderRow> {
  const profile = await getOrCreateProfile(input.phone);
  const serviceFeeRate = 0.02;
  const subtotal = input.pricePerNight * input.nights;
  const serviceFee = subtotal * serviceFeeRate;
  const amount = subtotal + serviceFee;
  const reference = nextHotelReference();

  
  
  const [order] = await db
  .insert(schema.hotelOrders)
  .values({
    reference,
    userId: profile.id,
    phone: input.phone,
    hotelId: input.hotelId,
    roomTypeId: input.roomTypeId,
    roomTypeName: input.roomTypeName,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    nights: input.nights,
    guests: input.guests,
    serviceFee:String(serviceFee),
    subtotal: String(subtotal),
    pricePerNight: String(input.pricePerNight),
      amount: String(amount),
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    })
    .returning();

  void publishHotelOrderEvent("created", order);

  return order;
}

export async function getHotelOrderById(id: string): Promise<HotelOrderRow | null> {
  const rows = await db.select().from(schema.hotelOrders).where(eq(schema.hotelOrders.id, id)).limit(1);
  return rows[0] ?? null;
}

export interface HotelOrderSummary {
  order: HotelOrderRow;
  hotelName: string;
  hotelAddress: string;
}

/** Everything the hotel order review page needs in one call. */
export async function getHotelOrderSummary(orderId: string): Promise<HotelOrderSummary | null> {
  const order = await getHotelOrderById(orderId);
  if (!order) return null;
  const hotel = await getHotelById(order.hotelId);
  return { order, hotelName: hotel?.name ?? "Hotel", hotelAddress: hotel?.address ?? "" };
}


export async function findHotelOrderByReference(
  reference: string
): Promise<HotelOrderWithDetails | null> {
  const rows = await db
    .select({
      ...getTableColumns(schema.hotelOrders),

      guestName: schema.profiles.displayName,
      guestPhone: schema.profiles.phone,
      guestEmail: schema.profiles.email,

      hotelName: schema.hotelPartners.name,
    })
    .from(schema.hotelOrders)
    .leftJoin(
      schema.profiles,
      eq(schema.hotelOrders.userId, schema.profiles.id)
    )
    .leftJoin(
      schema.hotelPartners,
      eq(schema.hotelOrders.hotelId, schema.hotelPartners.id)
    )
    .where(eq(schema.hotelOrders.reference, reference))
    .limit(1);

  return rows[0] ?? null;
}

export async function initiateHotelOrderPayment(orderId: string, email: string): Promise<HotelOrderRow> {
  const order = await getHotelOrderById(orderId);
  if (!order) throw new Error("Hotel order not found");

  const payment = await initializeTransaction({
    email,
    amountKobo: Math.round(Number(order.amount) * 100),
    reference: order.reference,
    metadata: { phone: order.phone, kind: "hotel", orderId: order.id },
  });

  const [updated] = await db
    .update(schema.hotelOrders)
    .set({
      status: "awaiting_payment",
      accessCode: payment.accessCode,
      authorizationUrl: payment.authorizationUrl,
      paystackReference: payment.reference,
      updatedAt: new Date(),
    })
    .where(eq(schema.hotelOrders.id, orderId))
    .returning();

  return updated;
}

/**
 * Buyer's payment has cleared. The order moves to "paid" — NOT "confirmed"
 * yet — because the hotel still needs to accept or decline the booking.
 * They get a fresh 30-minute window (reusing `expiresAt`) to respond;
 * an external cron job is responsible for flagging orders that blow past
 * that window as "expired".
 */
export async function markHotelOrderPaid(orderId: string): Promise<HotelOrderRow> {
  const [updated] = await db
    .update(schema.hotelOrders)
    .set({
      status: "paid",
      paidAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      updatedAt: new Date(),
    })
    .where(eq(schema.hotelOrders.id, orderId))
    .returning();
  void publishHotelOrderEvent("paid", updated);
  return updated;
}


export async function getPendingRefunds(limit = 20) {
  return db.query.hotelOrders.findMany({
    where: and(
      eq(schema.hotelOrders.refundStatus, "pending"),
      eq(schema.hotelOrders.status, "paid"),
    ),
    limit,
    with: {
      hotel: true,
    },
  });
}

export async function markRefundProcessing(orderId: string) {
  await db
    .update(schema.hotelOrders)
    .set({
      refundStatus: "processing",
      updatedAt: new Date(),
    })
    .where(eq(schema.hotelOrders.id, orderId));
}

export async function markRefundCompleted(
  orderId: string,
  reference: string
) {
  await db
    .update(schema.hotelOrders)
    .set({
      status: "refunded",
      refundStatus: "completed",
      refundedAt: new Date(),
      refundReference: reference,
      updatedAt: new Date(),
    })
    .where(eq(schema.hotelOrders.id, orderId));
}


export async function markRefundFailed(
  orderId: string,
  reason: string
) {
  await db
    .update(schema.hotelOrders)
    .set({
      refundStatus: "failed",
      refundFailureReason: reason,
      refundAttempts: sql`${schema.hotelOrders.refundAttempts} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(schema.hotelOrders.id, orderId));
}

/** Hotel accepted a paid booking request. */
export async function confirmHotelOrder(orderId: string): Promise<HotelOrderRow> {
  const [updated] = await db
    .update(schema.hotelOrders)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(eq(schema.hotelOrders.id, orderId))
    .returning();
  void publishHotelOrderEvent("confirmed", updated);
  return updated;
}

/** Hotel declined a paid booking request. */
export async function declineHotelOrder(orderId: string): Promise<HotelOrderRow> {
  const [updated] = await db
    .update(schema.hotelOrders)
    .set({ status: "declined", declinedAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.hotelOrders.id, orderId))
    .returning();
  void publishHotelOrderEvent("declined", updated);
  return updated;
}

/** Looks up a hotel partner by its own WhatsApp number — used to route inbound CONFIRM/DECLINE replies. */
export async function findHotelByWhatsappNumber(phone: string): Promise<HotelPartnerRow | null> {
  const rows = await db
    .select()
    .from(schema.hotelPartners)
    .where(eq(schema.hotelPartners.whatsappNumber, phone))
    .limit(1);
  return rows[0] ?? null;
}

// ---------------------------------------------------------------------------
// BOOKINGS OVERVIEW ("My bookings" menu option) — paginated, 10 at a time
// ---------------------------------------------------------------------------

export interface BookingsOverviewPage {
  tickets: { checkInCode: string; attendeeName: string; status: string; eventName: string; tierLabel: string }[];
  hotelOrders: { reference: string; roomTypeName: string; checkIn: Date; checkOut: Date; status: string; hotelName: string }[];
  hasMore: boolean;
  nextOffset: number;
}

export async function getBookingsOverview(phone: string, offset = 0, limit = PAGE_SIZE): Promise<BookingsOverviewPage> {
  // Tickets and hotel orders are interleaved by recency, so "more" pages
  // through a combined, per-kind offset rather than a single global cursor
  // (keeps the two independent queries simple while still paging cleanly).
  const profile = await getOrCreateProfile(phone);
  const ticketRows = await db
    .select({
      checkInCode: schema.tickets.checkInCode,
      attendeeName: schema.tickets.attendeeName,
      status: schema.tickets.status,
      eventName: schema.events.title,
      tierLabel: schema.ticketTiers.name,
    })
    .from(schema.tickets)
    .innerJoin(schema.events, eq(schema.tickets.eventId, schema.events.id))
    .innerJoin(schema.ticketTiers, eq(schema.tickets.tierId, schema.ticketTiers.id))
    .where(eq(schema.tickets.userId, profile.id))
    .orderBy(desc(schema.tickets.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const hotelRows = await db
    .select({
      reference: schema.hotelOrders.reference,
      roomTypeName: schema.hotelOrders.roomTypeName,
      checkIn: schema.hotelOrders.checkIn,
      checkOut: schema.hotelOrders.checkOut,
      status: schema.hotelOrders.status,
      hotelName: schema.hotelPartners.name,
    })
    .from(schema.hotelOrders)
    .innerJoin(schema.hotelPartners, eq(schema.hotelOrders.hotelId, schema.hotelPartners.id))
    .where(eq(schema.hotelOrders.phone, phone))
    .orderBy(desc(schema.hotelOrders.createdAt))
    .limit(limit + 1)
    .offset(offset);

  const ticketsPage = paginate(ticketRows, limit, offset);
  const hotelPage = paginate(hotelRows, limit, offset);

  return {
    tickets: ticketsPage.items,
    hotelOrders: hotelPage.items,
    hasMore: ticketsPage.hasMore || hotelPage.hasMore,
    nextOffset: offset + limit,
  };
}

// ---------------------------------------------------------------------------
// TICKET TRANSFERS
// ---------------------------------------------------------------------------

export interface CreateTransferInput {
  ticketId: string;
  /** Sender's phone — resolved to their existing profile (they already own the ticket). */
  fromPhone: string;
  /** Recipient's phone — just used to reach them over WhatsApp; their profile is only resolved/created when they claim. */
  toPhone: string;
}

export async function createTicketTransfer(input: CreateTransferInput): Promise<TicketTransferRow> {
  const fromProfile = await getOrCreateProfile(input.fromPhone);
  const transferCode = nextTransferCode();
  const [transfer] = await db
    .insert(schema.ticketTransfers)
    .values({
      ticketId: input.ticketId,
      fromUserId: fromProfile.id,
      recipientPhone: input.toPhone,
      transferCode,
      status: "pending",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })
    .returning();
  return transfer;
}

export async function getTransferByCode(code: string): Promise<TicketTransferRow | null> {
  const rows = await db
    .select()
    .from(schema.ticketTransfers)
    .where(eq(schema.ticketTransfers.transferCode, code))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * The recipient's confirmation step — hit from the web checkout view after
 * they tap the link and fill in their full name + email. Resolves (or
 * creates) the recipient's profile from `recipientPhone` here, and that
 * profile becomes the new ticket's owner (`userId`) — this is the one
 * point where `toUserId` gets set.
 */
export async function claimTransfer(
  code: string,
  fullName: string,
  email: string
): Promise<{ transfer: TicketTransferRow; ticket: TicketRow }> {
  const transfer = await getTransferByCode(code);
  if (!transfer) throw new Error("Transfer not found");
  if (transfer.status !== "pending") throw new Error(`This transfer is already ${transfer.status}`);
  if (transfer.expiresAt < new Date()) {
    await db.update(schema.ticketTransfers).set({ status: "expired" }).where(eq(schema.ticketTransfers.id, transfer.id));
    throw new Error("This transfer link has expired");
  }

  const original = await getTicketById(transfer.ticketId);
  if (!original) throw new Error("Original ticket not found");

  const [event, tierRows, toProfile, fromProfileRows] = await Promise.all([
    getEventById(original.eventId),
    db.select().from(schema.ticketTiers).where(eq(schema.ticketTiers.id, original.tierId)).limit(1),
    getOrCreateProfile(transfer.recipientPhone),
    db.select().from(schema.profiles).where(eq(schema.profiles.id, transfer.fromUserId)).limit(1),
  ]);
  const tier = tierRows[0];
  const fromPhone = fromProfileRows[0]?.phone;

  const { checkInCode, qrCode } = await createTicketQr({
    ticketId: original.id,
    eventId: original.eventId,
    buyerName: fullName,
    ticketTier: tier?.name ?? "General Admission",
    eventName: event?.title ?? "Event",
    eventStartsAt: event?.startsAt ?? new Date(),
    eventEndsAt: event?.endsAt,
    address: event?.address ?? "",
    banner: event?.backgroundImageUrl,
  });

  const [newTicket] = await db
    .insert(schema.tickets)
    .values({
      orderId: original.orderId,
      eventId: original.eventId,
      tierId: original.tierId,
      userId: toProfile.id,
      attendeeName: fullName,
      attendeeEmail: email,
      attendeePhone: transfer.recipientPhone,
      qrCode,
      checkInCode,
      status: "valid",
    })
    .returning();

  await db.update(schema.tickets).set({ status: "transferred" }).where(eq(schema.tickets.id, original.id));

  const [updatedTransfer] = await db
    .update(schema.ticketTransfers)
    .set({
      status: "claimed",
      toUserId: toProfile.id,
      claimedName: fullName,
      claimedEmail: email,
      claimedAt: new Date(),
      newTicketId: newTicket.id,
    })
    .where(eq(schema.ticketTransfers.id, transfer.id))
    .returning();

  if (fromPhone) {
    await sendMessage(
      fromPhone,
      `${fullName} has claimed the ticket you sent them for ${event?.title ?? "the event"}.`
    );
  }
  await sendMessage(
    transfer.recipientPhone,
    `Your ticket for ${event?.title ?? "the event"} is confirmed.\n\n` +
      `Name: ${fullName}\nRef: ${newTicket.checkInCode}\n\n` +
      `Save this chat and show your QR code at the door.`
  );
  await sendImageMessage(
    transfer.recipientPhone,
    newTicket.qrCode,
    `${fullName} - Ref: ${newTicket.checkInCode}`
  );

  return { transfer: updatedTransfer, ticket: newTicket };
}

export async function declineTransfer(code: string): Promise<TicketTransferRow> {
  const transfer = await getTransferByCode(code);
  if (!transfer) throw new Error("Transfer not found");
  if (transfer.status !== "pending") throw new Error(`This transfer is already ${transfer.status}`);

  const [updated] = await db
    .update(schema.ticketTransfers)
    .set({ status: "declined", declinedAt: new Date() })
    .where(eq(schema.ticketTransfers.id, transfer.id))
    .returning();

  const fromProfileRows = await db.select().from(schema.profiles).where(eq(schema.profiles.id, updated.fromUserId)).limit(1);
  const fromPhone = fromProfileRows[0]?.phone;
  if (fromPhone) {
    await sendMessage(
      fromPhone,
      `Your ticket transfer was declined by the recipient. It's still yours - type MENU to try transferring to someone else.`
    );
  }

  return updated;
}

// ---------------------------------------------------------------------------
// PAYMENT IDEMPOTENCY
//
// Webhooks (and their retries) and delayed queue jobs must never double-
// fulfil an order. Every confirmed gateway payment gets recorded here first,
// keyed uniquely on `reference`; if the insert is a no-op (conflict), the
// caller knows this reference was already processed and can skip straight
// past side effects like creating tickets or sending messages again.
// ---------------------------------------------------------------------------

export interface RecordProcessedPaymentInput {
  provider?: string;
  reference: string;
  paymentType: "ticket" | "hotel";
  userId: string;
  ticketOrderId?: string;
  hotelOrderId?: string;
  amount: number;
  currency?: string;
  metadata?: unknown;
}

export async function recordProcessedPaymentIfNew(input: RecordProcessedPaymentInput): Promise<boolean> {
  const rows = await db
    .insert(schema.processedPayments)
    .values({
      provider: input.provider ?? "paystack",
      reference: input.reference,
      paymentType: input.paymentType,
      userId: input.userId,
      ticketOrderId: input.ticketOrderId,
      hotelOrderId: input.hotelOrderId,
      amount: String(input.amount),
      currency: input.currency ?? "NGN",
      metadata: input.metadata,
    })
    .onConflictDoNothing()
    .returning({ id: schema.processedPayments.id });

  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// PENDING ITEMS — lets a buyer see and manually cancel anything still
// awaiting payment/confirmation, rather than waiting on the Supabase cron
// job that expires stale rows.
// ---------------------------------------------------------------------------

export interface PendingItemsPage {
  ticketOrders: { reference: string; eventName: string; status: string; amount: string; expiresAt: Date | null }[];
  hotelOrders: { reference: string; hotelName: string; status: string; amount: string; expiresAt: Date | null }[];
  transfers: { transferCode: string; recipientPhone: string; eventName: string; expiresAt: Date }[];
}

const CANCELLABLE_TICKET_ORDER_STATUSES = ["pending", "awaiting_payment"] as const;
const CANCELLABLE_HOTEL_ORDER_STATUSES = ["pending", "awaiting_payment", "paid"] as const;

export async function getPendingItemsForUser(phone: string): Promise<PendingItemsPage> {
  const profile = await getOrCreateProfile(phone);

  const ticketOrderRows = await db
    .select({
      reference: schema.ticketOrders.reference,
      status: schema.ticketOrders.status,
      amount: schema.ticketOrders.amount,
      expiresAt: schema.ticketOrders.expiresAt,
      eventName: schema.events.title,
    })
    .from(schema.ticketOrders)
    .innerJoin(schema.events, eq(schema.events.id, schema.ticketOrders.eventId))
    .where(
      and(
        eq(schema.ticketOrders.userId, profile.id),
        or(...CANCELLABLE_TICKET_ORDER_STATUSES.map((s) => eq(schema.ticketOrders.status, s)))
      )
    )
    .orderBy(desc(schema.ticketOrders.createdAt));

  const hotelOrderRows = await db
    .select({
      reference: schema.hotelOrders.reference,
      status: schema.hotelOrders.status,
      amount: schema.hotelOrders.amount,
      expiresAt: schema.hotelOrders.expiresAt,
      hotelName: schema.hotelPartners.name,
    })
    .from(schema.hotelOrders)
    .innerJoin(schema.hotelPartners, eq(schema.hotelPartners.id, schema.hotelOrders.hotelId))
    .where(
      and(
        eq(schema.hotelOrders.userId, profile.id),
        or(...CANCELLABLE_HOTEL_ORDER_STATUSES.map((s) => eq(schema.hotelOrders.status, s)))
      )
    )
    .orderBy(desc(schema.hotelOrders.createdAt));

  const transferRows = await db
    .select({
      transferCode: schema.ticketTransfers.transferCode,
      recipientPhone: schema.ticketTransfers.recipientPhone,
      expiresAt: schema.ticketTransfers.expiresAt,
      eventName: schema.events.title,
    })
    .from(schema.ticketTransfers)
    .innerJoin(schema.tickets, eq(schema.tickets.id, schema.ticketTransfers.ticketId))
    .innerJoin(schema.events, eq(schema.events.id, schema.tickets.eventId))
    .where(and(eq(schema.ticketTransfers.fromUserId, profile.id), eq(schema.ticketTransfers.status, "pending")))
    .orderBy(desc(schema.ticketTransfers.createdAt));

  return {
    ticketOrders: ticketOrderRows,
    hotelOrders: hotelOrderRows,
    transfers: transferRows,
  };
}

/** Buyer-initiated cancel of their own pending ticket order (no payment yet, or payment not confirmed). */
export async function cancelTicketOrderForUser(phone: string, reference: string): Promise<TicketOrderRow> {
  const profile = await getOrCreateProfile(phone);
  const order = await findTicketOrderByReference(reference);
  if (!order || order.userId !== profile.id) throw new Error("No matching order found.");
  if (!(CANCELLABLE_TICKET_ORDER_STATUSES as readonly string[]).includes(order.status)) {
    throw new Error(`This order is already ${order.status} and can no longer be cancelled.`);
  }

  const [updated] = await db
    .update(schema.ticketOrders)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.ticketOrders.id, order.id))
    .returning();
  return updated;
}

/** Buyer-initiated cancel of their own pending hotel order, including ones already paid but still awaiting the hotel's response. */
export async function cancelHotelOrderForUser(phone: string, reference: string): Promise<HotelOrderRow> {
  const profile = await getOrCreateProfile(phone);
  const order = await findHotelOrderByReference(reference);
  if (!order || order.userId !== profile.id) throw new Error("No matching booking found.");
  if (!(CANCELLABLE_HOTEL_ORDER_STATUSES as readonly string[]).includes(order.status)) {
    throw new Error(`This booking is already ${order.status} and can no longer be cancelled.`);
  }

  const [updated] = await db
    .update(schema.hotelOrders)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.hotelOrders.id, order.id))
    .returning();
  void publishHotelOrderEvent("cancelled", updated);
  return updated;
}

/** Sender-initiated cancel of a ticket transfer they haven't had claimed yet. */
export async function cancelTransferForUser(phone: string, transferCode: string): Promise<TicketTransferRow> {
  const profile = await getOrCreateProfile(phone);
  const transfer = await getTransferByCode(transferCode);
  if (!transfer || transfer.fromUserId !== profile.id) throw new Error("No matching transfer found.");
  if (transfer.status !== "pending") {
    throw new Error(`This transfer is already ${transfer.status} and can no longer be cancelled.`);
  }

  const [updated] = await db
    .update(schema.ticketTransfers)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(schema.ticketTransfers.id, transfer.id))
    .returning();
  return updated;
}

// ---------------------------------------------------------------------------
// Pagination helper — queries above fetch `limit + 1` rows so we can tell
// whether there's a next page without a separate COUNT(*) query.
// ---------------------------------------------------------------------------

function paginate<T>(rows: T[], limit: number, offset: number): Page<T> {
  const hasMore = rows.length > limit;
  return {
    items: hasMore ? rows.slice(0, limit) : rows,
    hasMore,
    nextOffset: offset + limit,
  };
}


export async function declineHotelOrderAndQueueRefund(
  orderId: string,
  reason: string,
): Promise<HotelOrderRow> {
  return db.transaction(async (tx) => {
    const [order] = await tx
      .update(schema.hotelOrders)
      .set({
        status: "declined",
        declinedAt: new Date(),
        refundStatus: "pending",
        refundReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(schema.hotelOrders.id, orderId))
      .returning();

    if (!order) {
      throw new Error("Hotel order not found.");
    }

    return order;
  });
}