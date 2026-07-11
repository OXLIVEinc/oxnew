/**
 * server/modules/discover/discover.service.ts
 * -------------------------------------------------------------------------
 * Replaces the old client-side "fake" Discover logic with real engagement
 * data. All rails only ever include events that are `active` + `approved`
 * and not already over.
 *
 *   Featured   - curated by admin (`events.isFeatured`). Guests/organizers
 *                cannot set this — it's out of scope for this module.
 *   Trending   - ranked by a weighted score of likes + registrations, so an
 *                event with lots of registrations but few likes (or vice
 *                versa) still surfaces reasonably.
 *   This Week  - events starting within the next 7 days, soonest first.
 *   Daily      - events starting today (server local date), soonest first.
 * -------------------------------------------------------------------------
 */
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/config/database";
import { events, type Event } from "@shared/schema";
import { getEngagementStatsForEvents, toEventSchedule } from "@/modules/events/events.repository";

// Tunable weighting for the trending score. Registrations are a stronger
// signal of real intent than a like, so they're weighted higher.
const TRENDING_LIKE_WEIGHT = 1;
const TRENDING_REGISTRATION_WEIGHT = 3;

function serialize(event: Event, stats: { likeCount: number; registrationCount: number }, extra: Record<string, unknown> = {}) {
  return {
    id: event.id,
    title: event.title,
    backgroundImageUrl: event.backgroundImageUrl,
    address: event.address,
    isPaid: event.isPaid,
    genre: event.genre,
    tags: event.tags ?? [],
    schedule: toEventSchedule(event),
    likeCount: stats.likeCount,
    registrationCount: stats.registrationCount,
    ...extra,
  };
}

async function loadPublicUpcomingEvents() {
  const now = new Date();
  return db
    .select()
    .from(events)
    .where(and(eq(events.status, "active"), eq(events.approvalStatus, "approved"), gte(events.startsAt, now)));
}

export async function getFeatured() {
  const now = new Date();
  const rows = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.status, "active"),
        eq(events.approvalStatus, "approved"),
        eq(events.isFeatured, true),
        gte(events.startsAt, now)
      )
    );
  const stats = await getEngagementStatsForEvents(rows.map((r) => r.id));
  return rows.map((e) => serialize(e, stats[e.id]));
}

export async function getTrending(limit = 20) {
  const rows = await loadPublicUpcomingEvents();
  const stats = await getEngagementStatsForEvents(rows.map((r) => r.id));

  return rows
    .map((event) => {
      const s = stats[event.id] ?? { likeCount: 0, registrationCount: 0 };
      const score = s.likeCount * TRENDING_LIKE_WEIGHT + s.registrationCount * TRENDING_REGISTRATION_WEIGHT;
      return { event, stats: s, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ event, stats, score }) => serialize(event, stats, { trendingScore: score }));
}

export async function getThisWeek() {
  const now = new Date();
  const sevenDaysOut = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.status, "active"),
        eq(events.approvalStatus, "approved"),
        gte(events.startsAt, now),
        lte(events.startsAt, sevenDaysOut)
      )
    );

  const stats = await getEngagementStatsForEvents(rows.map((r) => r.id));
  return rows
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .map((e) => serialize(e, stats[e.id]));
}

export async function getDaily() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const rows = await db
    .select()
    .from(events)
    .where(
      and(
        eq(events.status, "active"),
        eq(events.approvalStatus, "approved"),
        gte(events.startsAt, startOfDay),
        lte(events.startsAt, endOfDay)
      )
    );

  const stats = await getEngagementStatsForEvents(rows.map((r) => r.id));
  return rows
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .map((e) => serialize(e, stats[e.id]));
}

export async function getDiscoverFeed() {
  const [featured, trending, thisWeek, daily] = await Promise.all([
    getFeatured(),
    getTrending(),
    getThisWeek(),
    getDaily(),
  ]);
  return { featured, trending, thisWeek, daily };
}
