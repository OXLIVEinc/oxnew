/**
 * server/modules/registrations/registrations.service.ts
 * -------------------------------------------------------------------------
 * Every registration or purchase — free or paid — ends the same way: one
 * `event_registrations` row and one `tickets` row with a generated QR
 * ticket card. This module is the single place that creates a ticket, so
 * that guarantee can't drift between the free and paid code paths.
 *
 * Free tier (price === 0):
 *   -> registration + ticket + QR are created immediately.
 *
 * Paid tier (price > 0):
 *   -> a `ticket_orders` row is created (status "pending") and returned to
 *      the client to continue to checkout. The actual ticket + QR are
 *      created by `finalizePaidOrder` once the payments module confirms
 *      the order is paid (see server/modules/payments — stubbed for now,
 *      wire up your Paystack webhook there).
 * -------------------------------------------------------------------------
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/config/database";
import { events, ticketTiers, eventRegistrations, tickets, ticketOrders, profiles } from "@shared/schema";
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
    venue: params.event.venue,
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
