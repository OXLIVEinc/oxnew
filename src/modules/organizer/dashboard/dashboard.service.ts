import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/config/database";
import { events, eventRegistrations, ticketTiers, tickets, profiles } from "@shared/schema";
import { AppError } from "@/middleware/error.middleware";
import { toEventSchedule } from "@/modules/events/events.repository";

async function getOrganizerEventIds(profileId: string): Promise<string[]> {
  const rows = await db.select({ id: events.id }).from(events).where(eq(events.createdBy, profileId));
  return rows.map((r) => r.id);
}

export async function getOverview(profileId: string) {
  const eventIds = await getOrganizerEventIds(profileId);
  if (eventIds.length === 0) {
    return { totalEvents: 0, activeEvents: 0, totalGuests: 0, ticketsSold: 0, totalRevenue: 0 };
  }

  const [eventStats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${events.status} = 'active')::int`,
    })
    .from(events)
    .where(eq(events.createdBy, profileId));

  const [regStats] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eventRegistrations)
    .where(inArray(eventRegistrations.eventId, eventIds));

  const tierRows = await db
    .select({ sold: ticketTiers.sold, price: ticketTiers.price })
    .from(ticketTiers)
    .where(inArray(ticketTiers.eventId, eventIds));

  const ticketsSold = tierRows.reduce((s, t) => s + t.sold, 0);
  const totalRevenue = tierRows.reduce((s, t) => s + t.sold * Number(t.price), 0);

  return {
    totalEvents: eventStats?.total ?? 0,
    activeEvents: eventStats?.active ?? 0,
    totalGuests: regStats?.count ?? 0,
    ticketsSold,
    totalRevenue,
  };
}

export async function listOrganizerEventsWithStats(profileId: string) {
  const rows = await db.select().from(events).where(eq(events.createdBy, profileId)).orderBy(desc(events.startsAt));
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const regRows = await db
    .select({ eventId: eventRegistrations.eventId, count: sql<number>`count(*)::int` })
    .from(eventRegistrations)
    .where(inArray(eventRegistrations.eventId, ids))
    .groupBy(eventRegistrations.eventId);
  const countMap = Object.fromEntries(regRows.map((r) => [r.eventId, r.count]));

  return rows.map((e) => {
    const schedule = toEventSchedule(e);
    return {
      id: e.id,
      title: e.title,
      date: schedule.date,
      time: schedule.time,
      status: e.status,
      backgroundImageUrl: e.backgroundImageUrl,
      targetDate: e.startsAt,
      guestCount: countMap[e.id] ?? 0,
    };
  });
}

export async function getEventAnalytics(
  profileId: string,
  eventId: string,
  dateFrom?: string,
  dateTo?: string
) {
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, eventId), eq(events.createdBy, profileId)))
    .limit(1);
  if (!event) throw AppError.forbidden("You do not own this event");

  const conditions = [eq(eventRegistrations.eventId, eventId)];
  if (dateFrom) conditions.push(gte(eventRegistrations.registeredAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(eventRegistrations.registeredAt, new Date(`${dateTo}T23:59:59`)));

  const regs = await db
    .select({ userId: eventRegistrations.userId, registeredAt: eventRegistrations.registeredAt })
    .from(eventRegistrations)
    .where(and(...conditions));

  const tierRows = await db.select().from(ticketTiers).where(eq(ticketTiers.eventId, eventId));
  const tierBreakdown = tierRows.map((t) => ({ name: t.name, sold: t.sold, revenue: t.sold * Number(t.price) }));
  const revenue = tierBreakdown.reduce((s, t) => s + t.revenue, 0);

  if (regs.length === 0) {
    return { totalGuests: 0, checkedIn: 0, revenue, genderCounts: {}, locationCounts: {}, registrationsOverTime: [], tierBreakdown };
  }

const userIds = [
  ...new Set(regs.flatMap((r) => (r.userId ? [r.userId] : []))),
];
  const [profileRows, ticketRows] = await Promise.all([
    db
      .select({ id: profiles.id, gender: profiles.gender, locationCountry: profiles.locationCountry })
      .from(profiles)
      .where(inArray(profiles.id, userIds)),
    db.select({ userId: tickets.userId, checkedIn: tickets.checkedIn }).from(tickets).where(eq(tickets.eventId, eventId)),
  ]);

  const genderCounts: Record<string, number> = {};
  profileRows.forEach((p) => {
    const g = p.gender || "Not specified";
    genderCounts[g] = (genderCounts[g] || 0) + 1;
  });

  const locationCounts: Record<string, number> = {};
  profileRows.forEach((p) => {
    const l = p.locationCountry || "Not specified";
    locationCounts[l] = (locationCounts[l] || 0) + 1;
  });

  const dateMap: Record<string, number> = {};
  regs.forEach((r) => {
    const d = r.registeredAt.toISOString().slice(0, 10);
    dateMap[d] = (dateMap[d] || 0) + 1;
  });
  const registrationsOverTime = Object.entries(dateMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const checkedIn = ticketRows.filter((t) => t.checkedIn).length;

  return { totalGuests: regs.length, checkedIn, revenue, genderCounts, locationCounts, registrationsOverTime, tierBreakdown };
}