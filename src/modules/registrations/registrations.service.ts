
import { and, eq,inArray } from "drizzle-orm";
import { db } from "@/config/database";
import { events, ticketTiers, eventRegistrations, tickets, ticketOrders, profiles,type OrderItem } from "@shared/schema";
import { AppError } from "@/middleware/error.middleware";
import { isTierSoldOut, toEventSchedule } from "@/modules/events/events.repository";
import { createTicketQr } from "@/lib/qr/create-ticket-qr";
import { generateOrderReference } from "@/utils/helpers";

export interface RegisterInput {
  eventId: string;
  tierId: string;
  attendeeName: string;
  attendeeEmail?: string;
  attendeePhone?: string;
}

export interface OrderSelection {
  tierId: string;
}

export interface CreateOrderInput {
  eventId: string;
  selections: OrderSelection[];
}

async function loadEventAndTier(eventId: string, tierId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw AppError.notFound("Event not found");

  const [tier] = await db
    .select()
    .from(ticketTiers)
    .where(and(eq(ticketTiers.id, tierId), eq(ticketTiers.eventId, eventId)))
    .limit(1);
  if (!tier) throw AppError.notFound("Ticket tier not found for this event");

  if (isTierSoldOut(tier)) {
    throw new AppError(`"${tier.name}" is sold out`, 409, "TIER_SOLD_OUT");
  }

  return { event, tier };
}

/** Generates the ticket card image + QR and writes the final URL/check-in code onto the ticket row. */
async function generateAndAttachQr(params: {
  ticketId: string;
  event: typeof events.$inferSelect;
  tierName: string;
  attendeeName: string;
}) {
  const schedule = toEventSchedule(params.event);
  const { checkInCode, qrCode } = await createTicketQr({
    ticketId: params.ticketId,
    eventId: params.event.id,
    buyerName: params.attendeeName,
    ticketTier: params.tierName,
    eventName: params.event.title,
    eventDate: `${schedule.date} ${schedule.time}`,
    venue: params.event.address,
    banner: params.event.desktopBannerUrl ?? params.event.backgroundImageUrl,
  });

  await db.update(tickets).set({ qrCode, checkInCode }).where(eq(tickets.id, params.ticketId));
  return { checkInCode, qrCode };
}

/**
 * Registers a guest for an event. For free tiers this immediately creates
 * the ticket. For paid tiers this creates a pending order and the caller
 * must continue to payment (see payments module).
 */
export async function registerForEvent(profileId: string, input: RegisterInput) {
  const { event, tier } = await loadEventAndTier(input.eventId, input.tierId);
  const price = Number(tier.price);

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);

  if (price > 0) {
    // Paid tier: hand back a pending order for the client to complete payment on.
    const [order] = await db
      .insert(ticketOrders)
      .values({
        reference: generateOrderReference("ord"),
        userId: profileId,
        phone: input.attendeePhone ?? profile?.phone ?? "",
        eventId: event.id,
        tierId: tier.id,
        quantity: 1,
        unitPrice: tier.price,
        subtotal: tier.price,
        amount: tier.price,
        items: [{ attendeeName: input.attendeeName, attendeeEmail: input.attendeeEmail ?? "" }],
        status: "pending",
      })
      .returning();

    return { requiresPayment: true as const, order };
  }

  // Free tier: create the registration + ticket right away, inside one transaction.
  const ticket = await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(eventRegistrations)
      .where(and(eq(eventRegistrations.eventId, event.id), eq(eventRegistrations.userId, profileId)))
      .limit(1);
    if (existing) {
      throw new AppError("You're already registered for this event", 409, "ALREADY_REGISTERED");
    }

    await tx.insert(eventRegistrations).values({
      eventId: event.id,
      userId: profileId,
      ticketTierId: tier.id,
    });

    await tx.update(ticketTiers).set({ sold: tier.sold + 1 }).where(eq(ticketTiers.id, tier.id));

    // Placeholder qr_code/check_in_code (both NOT NULL) — replaced right after
    // the transaction commits, once we have a stable ticket id to sign into
    // the QR payload.
    const [createdTicket] = await tx
      .insert(tickets)
      .values({
        eventId: event.id,
        tierId: tier.id,
        userId: profileId,
        attendeeName: input.attendeeName,
        attendeeEmail: input.attendeeEmail ?? null,
        attendeePhone: input.attendeePhone ?? null,
        qrCode: "pending",
        checkInCode: "pending",
      })
      .returning();

    return createdTicket;
  });

  const { checkInCode, qrCode } = await generateAndAttachQr({
    ticketId: ticket.id,
    event,
    tierName: tier.name,
    attendeeName: input.attendeeName,
  });

  return { requiresPayment: false as const, ticket: { ...ticket, checkInCode, qrCode } };
}

/**
 * Called once a paid order is confirmed paid (from the payments webhook).
 * Creates the registration + ticket + QR exactly like the free path.
 */
export async function finalizePaidOrder(orderId: string) {
  const [order] = await db.select().from(ticketOrders).where(eq(ticketOrders.id, orderId)).limit(1);
  if (!order) throw AppError.notFound("Order not found");
  if (order.status === "paid") return; // idempotent

  const [event] = await db.select().from(events).where(eq(events.id, order.eventId)).limit(1);
  const [tier] = await db.select().from(ticketTiers).where(eq(ticketTiers.id, order.tierId)).limit(1);
  if (!event || !tier) throw AppError.notFound("Event or ticket tier no longer exists");

  const attendee = order.items?.[0] ?? { attendeeName: "Guest", attendeeEmail: "" };

  const ticket = await db.transaction(async (tx) => {
    await tx
      .insert(eventRegistrations)
      .values({ eventId: event.id, userId: order.userId, ticketTierId: tier.id })
      .onConflictDoNothing();

    await tx.update(ticketTiers).set({ sold: tier.sold + 1 }).where(eq(ticketTiers.id, tier.id));

    await tx
      .update(ticketOrders)
      .set({ status: "paid", paidAt: new Date() })
      .where(eq(ticketOrders.id, order.id));

    const [createdTicket] = await tx
      .insert(tickets)
      .values({
        orderId: order.id,
        eventId: event.id,
        tierId: tier.id,
        userId: order.userId,
        attendeeName: attendee.attendeeName,
        attendeeEmail: attendee.attendeeEmail || null,
        attendeePhone: order.phone,
        qrCode: "pending",
        checkInCode: "pending",
      })
      .returning();

    return createdTicket;
  });

  await generateAndAttachQr({
    ticketId: ticket.id,
    event,
    tierName: tier.name,
    attendeeName: attendee.attendeeName,
  });
}


export async function createEventOrder(profileId: string, input: CreateOrderInput) {
  if (!input.selections || input.selections.length === 0) {
    throw new AppError("Select at least one ticket", 422, "NO_TICKETS_SELECTED");
  }
  if (input.selections.length > 20) {
    throw new AppError("You can register up to 20 tickets at a time", 422, "TOO_MANY_TICKETS");
  }

  const [event] = await db.select().from(events).where(eq(events.id, input.eventId)).limit(1);
  if (!event) throw AppError.notFound("Event not found");

  const tierIds = [...new Set(input.selections.map((s) => s.tierId))];
  const tierRows = await db.select().from(ticketTiers).where(inArray(ticketTiers.id, tierIds));
  const tierMap = new Map(tierRows.map((t) => [t.id, t]));

  const countByTier = new Map<string, number>();
  for (const selection of input.selections) {
    const tier = tierMap.get(selection.tierId);
    if (!tier || tier.eventId !== input.eventId) {
      throw new AppError("One or more selected ticket tiers are invalid", 422, "INVALID_TIER");
    }
    countByTier.set(selection.tierId, (countByTier.get(selection.tierId) ?? 0) + 1);
  }

  // Respect quantity/isUnlimited exactly like the bot's createTicketOrder.
  for (const [tierId, count] of countByTier) {
    const tier = tierMap.get(tierId)!;
    if (isTierSoldOut(tier)) {
      throw new AppError(`"${tier.name}" is sold out`, 409, "TIER_SOLD_OUT");
    }
    if (!tier.isUnlimited) {
      const remaining = Math.max(0, (tier.quantity ?? 0) - tier.sold);
      if (count > remaining) {
        throw new AppError(`Only ${remaining} ticket(s) left for "${tier.name}"`, 409, "TIER_SOLD_OUT");
      }
    }
  }

  const subtotal = input.selections.reduce((sum, s) => sum + Number(tierMap.get(s.tierId)!.price), 0);
  const serviceFeeRate = 0.02;
  const serviceFee = Math.round(subtotal * serviceFeeRate * 100) / 100;
  const amount = subtotal + serviceFee;

  // Placeholder items — tier + price locked in now, name/email filled in
  // on the checkout page, exactly like the bot's items get filled at
  // submitOrderItems time.
  const items: OrderItem[] = input.selections.map((s) => ({
    attendeeName: "",
    attendeeEmail: "",
    tierId: s.tierId,
    unitPrice: Number(tierMap.get(s.tierId)!.price),
  }));

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  const primaryTierId = input.selections[0].tierId;

  const [order] = await db
    .insert(ticketOrders)
    .values({
      reference: generateOrderReference("ord"),
      userId: profileId,
      phone: profile?.phone ?? "",
      eventId: input.eventId,
      tierId: primaryTierId,
      quantity: input.selections.length,
      unitPrice: String(Number((subtotal / input.selections.length).toFixed(2))),
      subtotal: String(subtotal),
      amount: String(amount),
      items,
      status: "pending",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    })
    .returning();

  return order;
}