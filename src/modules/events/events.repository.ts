/**
 * server/modules/events/events.repository.ts
 * -------------------------------------------------------------------------
 * Query helpers shared by the events, discover, and guest modules. Keeping
 * these in one place avoids three slightly-different copies of the same
 * "how many people like/registered for this event" logic.
 * -------------------------------------------------------------------------
 */
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/config/database";
import { events, eventLikes, eventRegistrations, ticketTiers, type Event } from "@shared/schema";

export interface EngagementStats {
  likeCount: number;
  registrationCount: number;
}

/**
 * Batch-loads like + registration counts for a set of events in two grouped
 * queries (instead of N+1 per-event queries).
 */
export async function getEngagementStatsForEvents(
  eventIds: string[]
): Promise<Record<string, EngagementStats>> {
  if (eventIds.length === 0) return {};

  const [likeRows, registrationRows] = await Promise.all([
    db
      .select({ eventId: eventLikes.eventId, count: sql<number>`count(*)::int` })
      .from(eventLikes)
      .where(inArray(eventLikes.eventId, eventIds))
      .groupBy(eventLikes.eventId),
    db
      .select({ eventId: eventRegistrations.eventId, count: sql<number>`count(*)::int` })
      .from(eventRegistrations)
      .where(inArray(eventRegistrations.eventId, eventIds))
      .groupBy(eventRegistrations.eventId),
  ]);

  const stats: Record<string, EngagementStats> = {};
  for (const id of eventIds) {
    stats[id] = { likeCount: 0, registrationCount: 0 };
  }
  for (const row of likeRows) {
    stats[row.eventId].likeCount = row.count;
  }
  for (const row of registrationRows) {
    stats[row.eventId].registrationCount = row.count;
  }
  return stats;
}

/** A single event's engagement (convenience wrapper around the batch version). */
export async function getEngagementStatsForEvent(eventId: string): Promise<EngagementStats> {
  const stats = await getEngagementStatsForEvents([eventId]);
  return stats[eventId] ?? { likeCount: 0, registrationCount: 0 };
}

/** Loads all ticket tiers for a set of events, grouped by event id. */
export async function getTiersForEvents(eventIds: string[]) {
  if (eventIds.length === 0) return {} as Record<string, (typeof ticketTiers.$inferSelect)[]>;

  const rows = await db.select().from(ticketTiers).where(inArray(ticketTiers.eventId, eventIds));

  const byEvent: Record<string, (typeof ticketTiers.$inferSelect)[]> = {};
  for (const id of eventIds) byEvent[id] = [];
  for (const row of rows) {
    byEvent[row.eventId].push(row);
  }
  return byEvent;
}

/**
 * A ticket tier is sold out only when it's a *limited* tier whose sold
 * count has reached its quantity. Unlimited tiers are never sold out.
 * This is derived on read — there is no `isSoldOut` column to keep in sync.
 */
export function isTierSoldOut(tier: { isUnlimited: boolean; quantity: number | null; sold: number }): boolean {
  if (tier.isUnlimited) return false;
  if (tier.quantity === null) return false;
  return tier.sold >= tier.quantity;
}

/**
 * The public-facing schedule shown to guests:
 *   - `date` / `time` derived from the required startsAt + startTime
 *   - `endDate` / `endTime` included only when the organizer provided them
 * This is the single place that turns the four schema columns
 * (startsAt, startTime, endsAt, endTime) into what the UI renders, so every
 * page (event card, event detail, dashboard, discover) shows the same thing.
 */
export function toEventSchedule(event: Pick<Event, "startsAt" | "startTime" | "endsAt" | "endTime">) {
  const startsAt = new Date(event.startsAt);
  return {
    date: startsAt.toISOString().slice(0, 10), // "2026-08-14"
    time: event.startTime, // "15:00"
    endDate: event.endsAt ? new Date(event.endsAt).toISOString().slice(0, 10) : null,
    endTime: event.endTime ?? null,
    isUpcoming: startsAt.getTime() >= Date.now(),
  };
}

export async function findEventOr404(eventId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return event ?? null;
}
