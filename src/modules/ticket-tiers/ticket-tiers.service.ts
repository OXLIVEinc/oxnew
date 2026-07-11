/**
 * server/modules/ticket-tiers/ticket-tiers.service.ts
 * -------------------------------------------------------------------------
 * Encodes the ticket-tier rules from the product spec:
 *
 *   - Every event needs at least one tier. If the organizer submits none,
 *     a default "General Admission" tier is created for them.
 *   - Paid events need at least one tier with a price > 0.
 *   - Free events default any missing/zero price to 0 — never blocked.
 *   - A tier is either `isUnlimited: true` (no quantity, never sells out)
 *     or `isUnlimited: false` with a required positive `quantity`.
 *   - "Sold out" is derived (sold >= quantity), never stored.
 * -------------------------------------------------------------------------
 */
import { and, eq } from "drizzle-orm";
import { db, type Database, type Transaction } from "@/config/database";
import { ticketTiers, events } from "@shared/schema";
import { AppError } from "@/middleware/error.middleware";
import { isTierSoldOut } from "@/modules/events/events.repository";

export interface TicketTierInput {
  id?: string; // present when editing an existing tier
  name: string;
  description?: string | null;
  price?: number | null;
  isUnlimited: boolean;
  quantity?: number | null;
}

const DEFAULT_TIER_NAME = "General Admission";

/**
 * Normalizes + validates the tiers an organizer submitted when creating or
 * editing an event. Returns the tiers ready to persist (never mutates the
 * caller's array). Throws AppError(422) on any rule violation.
 */
export function normalizeAndValidateTiers(
  isPaid: boolean,
  rawTiers: TicketTierInput[] | undefined | null
): TicketTierInput[] {
  let tiers = rawTiers && rawTiers.length > 0 ? rawTiers : [];

  // Every event must have at least one tier — default to General Admission.
  if (tiers.length === 0) {
    tiers = [
      {
        name: DEFAULT_TIER_NAME,
        description: null,
        price: 0,
        isUnlimited: false,
        quantity: 100,
      },
    ];
  }

  const normalized: TicketTierInput[] = tiers.map((tier) => {
    if (!tier.name || !tier.name.trim()) {
      throw new AppError("Every ticket tier must have a name", 422, "TIER_NAME_REQUIRED");
    }

    if (!tier.isUnlimited) {
      if (!tier.quantity || tier.quantity <= 0) {
        throw new AppError(
          `"${tier.name}" needs a quantity greater than 0, or switch it to Unlimited`,
          422,
          "TIER_QUANTITY_REQUIRED"
        );
      }
    }

    // Free events: missing/blank price silently defaults to 0 (never blocks).
    const price = isPaid ? Number(tier.price ?? 0) : 0;

    if (isPaid && price < 0) {
      throw new AppError(`"${tier.name}" price cannot be negative`, 422, "TIER_PRICE_INVALID");
    }

    return {
      id: tier.id,
      name: tier.name.trim(),
      description: tier.description?.trim() || null,
      price,
      isUnlimited: tier.isUnlimited,
      quantity: tier.isUnlimited ? null : Number(tier.quantity),
    };
  });

  // Paid events need at least one tier actually priced above ₦0.
  if (isPaid && !normalized.some((t) => (t.price ?? 0) > 0)) {
    throw new AppError(
      "Paid events need at least one ticket tier priced above ₦0",
      422,
      "PAID_EVENT_NEEDS_PRICED_TIER"
    );
  }

  return normalized;
}

/** Inserts tiers for a freshly created event. Call inside the same transaction as the event insert. */
export async function insertTiersForEvent(
  tx: Database | Transaction,
  eventId: string,
  tiers: TicketTierInput[]
) {
  const rows = tiers.map((tier) => ({
    eventId,
    name: tier.name,
    description: tier.description ?? null,
    price: String(tier.price ?? 0),
    isUnlimited: tier.isUnlimited,
    quantity: tier.isUnlimited ? null : tier.quantity ?? null,
  }));
  return tx.insert(ticketTiers).values(rows).returning();
}

export async function listTiersForEvent(eventId: string) {
  const rows = await db.select().from(ticketTiers).where(eq(ticketTiers.eventId, eventId));
  return rows
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((tier) => ({ ...tier, isSoldOut: isTierSoldOut(tier) }));
}

async function assertOwnsEventTiers(eventId: string, requesterProfileId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw AppError.notFound("Event not found");
  if (event.createdBy !== requesterProfileId) {
    throw AppError.forbidden("You do not own this event");
  }
  return event;
}

export async function addTierToEvent(
  eventId: string,
  requesterProfileId: string,
  input: TicketTierInput
) {
  const event = await assertOwnsEventTiers(eventId, requesterProfileId);
  const [normalized] = normalizeAndValidateTiers(event.isPaid, [input]);
  const [row] = await db
    .insert(ticketTiers)
    .values({
      eventId,
      name: normalized.name,
      description: normalized.description,
      price: String(normalized.price ?? 0),
      isUnlimited: normalized.isUnlimited,
      quantity: normalized.quantity,
    })
    .returning();
  return { ...row, isSoldOut: isTierSoldOut(row) };
}

export async function updateTier(
  eventId: string,
  tierId: string,
  requesterProfileId: string,
  input: Partial<TicketTierInput>
) {
  const event = await assertOwnsEventTiers(eventId, requesterProfileId);

  const [existing] = await db
    .select()
    .from(ticketTiers)
    .where(and(eq(ticketTiers.id, tierId), eq(ticketTiers.eventId, eventId)))
    .limit(1);
  if (!existing) throw AppError.notFound("Ticket tier not found");

  const merged: TicketTierInput = {
    name: input.name ?? existing.name,
    description: input.description ?? existing.description,
    price: input.price ?? Number(existing.price),
    isUnlimited: input.isUnlimited ?? existing.isUnlimited,
    quantity: input.quantity ?? existing.quantity,
  };
  const [normalized] = normalizeAndValidateTiers(event.isPaid, [merged]);

  // Don't let quantity drop below tickets already sold.
  if (!normalized.isUnlimited && normalized.quantity != null && normalized.quantity < existing.sold) {
    throw new AppError(
      `Quantity can't be less than the ${existing.sold} tickets already sold`,
      422,
      "TIER_QUANTITY_BELOW_SOLD"
    );
  }

  const [row] = await db
    .update(ticketTiers)
    .set({
      name: normalized.name,
      description: normalized.description,
      price: String(normalized.price ?? 0),
      isUnlimited: normalized.isUnlimited,
      quantity: normalized.quantity,
    })
    .where(eq(ticketTiers.id, tierId))
    .returning();

  return { ...row, isSoldOut: isTierSoldOut(row) };
}

export async function deleteTier(eventId: string, tierId: string, requesterProfileId: string) {
  await assertOwnsEventTiers(eventId, requesterProfileId);

  const allTiers = await db.select().from(ticketTiers).where(eq(ticketTiers.eventId, eventId));
  if (allTiers.length <= 1) {
    throw new AppError(
      "An event must always have at least one ticket tier",
      422,
      "CANNOT_DELETE_LAST_TIER"
    );
  }

  const target = allTiers.find((t) => t.id === tierId);
  if (!target) throw AppError.notFound("Ticket tier not found");
  if (target.sold > 0) {
    throw new AppError(
      "This tier already has tickets sold and can't be deleted",
      409,
      "TIER_HAS_SALES"
    );
  }

  await db.delete(ticketTiers).where(eq(ticketTiers.id, tierId));
}
