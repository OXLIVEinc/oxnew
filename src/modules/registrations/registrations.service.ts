
import { and, eq,inArray } from "drizzle-orm";
import { db } from "@/config/database";
import { events, ticketTiers, ticketOrders, profiles,type OrderItem } from "@shared/schema";
import { AppError } from "@/middleware/error.middleware";
import { isTierSoldOut, } from "@/modules/events/events.repository";
import { generateReference } from "@/utils/helpers";

export interface OrderSelection {
  tierId: string;
}

export interface CreateOrderInput {
  eventId: string;
  selections: OrderSelection[];
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
      reference: generateReference("OX-ORD"),
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
      orderSource: "web",
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    })
    .returning();

  return order;
}




export interface CreateGuestOrderInput {
  eventId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  selections: OrderSelection[];
}

export async function createGuestEventOrder(input: CreateGuestOrderInput) {
  if (!input.guestName.trim()) {
    throw new AppError("Guest name is required", 422, "GUEST_NAME_REQUIRED");
  }

  if (!input.guestEmail.trim()) {
    throw new AppError("Guest email is required", 422, "GUEST_EMAIL_REQUIRED");
  }

  if (!input.selections || input.selections.length === 0) {
    throw new AppError("Select at least one ticket", 422, "NO_TICKETS_SELECTED");
  }

  if (input.selections.length > 20) {
    throw new AppError(
      "You can register up to 20 tickets at a time",
      422,
      "TOO_MANY_TICKETS"
    );
  }

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, input.eventId))
    .limit(1);

  if (!event) {
    throw AppError.notFound("Event not found");
  }

  const tierIds = [...new Set(input.selections.map((s) => s.tierId))];

  const tierRows = await db
    .select()
    .from(ticketTiers)
    .where(inArray(ticketTiers.id, tierIds));

  const tierMap = new Map(tierRows.map((t) => [t.id, t]));

  const countByTier = new Map<string, number>();

  for (const selection of input.selections) {
    const tier = tierMap.get(selection.tierId);

    if (!tier || tier.eventId !== input.eventId) {
      throw new AppError(
        "One or more selected ticket tiers are invalid",
        422,
        "INVALID_TIER"
      );
    }

    countByTier.set(
      selection.tierId,
      (countByTier.get(selection.tierId) ?? 0) + 1
    );
  }

  for (const [tierId, count] of countByTier) {
    const tier = tierMap.get(tierId)!;

    if (isTierSoldOut(tier)) {
      throw new AppError(
        `"${tier.name}" is sold out`,
        409,
        "TIER_SOLD_OUT"
      );
    }

    if (!tier.isUnlimited) {
      const remaining = Math.max(0, (tier.quantity ?? 0) - tier.sold);

      if (count > remaining) {
        throw new AppError(
          `Only ${remaining} ticket(s) left for "${tier.name}"`,
          409,
          "TIER_SOLD_OUT"
        );
      }
    }
  }

  const subtotal = input.selections.reduce(
    (sum, s) => sum + Number(tierMap.get(s.tierId)!.price),
    0
  );

  const serviceFeeRate = 0.02;
  const serviceFee = Math.round(subtotal * serviceFeeRate * 100) / 100;
  const amount = subtotal + serviceFee;

  const items: OrderItem[] = input.selections.map((s) => ({
    attendeeName: "",
    attendeeEmail: "",
    tierId: s.tierId,
    unitPrice: Number(tierMap.get(s.tierId)!.price),
  }));

  const primaryTierId = input.selections[0].tierId;

  const [order] = await db
    .insert(ticketOrders)
    .values({
      reference: generateReference("OX-ORD"),

      // Anonymous checkout
      userId: null,

      guestName: input.guestName,
      guestEmail: input.guestEmail,

      phone: input.guestPhone ?? "",

      eventId: input.eventId,
      tierId: primaryTierId,
      quantity: input.selections.length,

      unitPrice: String(
        Number((subtotal / input.selections.length).toFixed(2))
      ),

      subtotal: String(subtotal),
      amount: String(amount),

      items,

      status: "pending",
      orderSource: "web",

      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    })
    .returning();

  return order;
}