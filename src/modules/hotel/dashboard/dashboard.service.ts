/**
 * server/modules/hotel/dashboard/dashboard.service.ts
 * -------------------------------------------------------------------------
 * Everything the dashboard landing page needs: overview cards, recent
 * bookings, upcoming arrivals, and the two summary charts. Reuses the
 * bookings repository for recent/upcoming lists so that logic (guest name
 * join, checked-in flag, etc.) isn't duplicated.
 * -------------------------------------------------------------------------
 */
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/config/database";
import { hotelOrders } from "@shared/schema";
import { getHotelIdForProfile } from "../hotel.access";
import { recentBookings, upcomingArrivals } from "../bookings/bookings.repository";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

async function countByStatus(hotelId: string, status: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hotelOrders)
    .where(and(eq(hotelOrders.hotelId, hotelId), eq(hotelOrders.status, status as never)));
  return row?.count ?? 0;
}

async function countTotal(hotelId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hotelOrders)
    .where(eq(hotelOrders.hotelId, hotelId));
  return row?.count ?? 0;
}

async function countCheckInsToday(hotelId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hotelOrders)
    .where(
      and(
        eq(hotelOrders.hotelId, hotelId),
        eq(hotelOrders.status, "confirmed"),
        gte(hotelOrders.checkIn, startOfDay()),
        lte(hotelOrders.checkIn, endOfDay())
      )
    );
  return row?.count ?? 0;
}

async function countCheckOutsToday(hotelId: string): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hotelOrders)
    .where(
      and(
        eq(hotelOrders.hotelId, hotelId),
        sql`${hotelOrders.status} in ('confirmed', 'completed')`,
        gte(hotelOrders.checkOut, startOfDay()),
        lte(hotelOrders.checkOut, endOfDay())
      )
    );
  return row?.count ?? 0;
}

async function revenueSince(hotelId: string, since: Date): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${hotelOrders.amount}), 0)` })
    .from(hotelOrders)
    .where(
      and(
        eq(hotelOrders.hotelId, hotelId),
        sql`${hotelOrders.status} in ('paid', 'confirmed', 'completed')`,
        gte(hotelOrders.paidAt, since)
      )
    );
  return Number(row?.total ?? 0);
}

export async function getOverview(profileId: string) {
  const hotelId = await getHotelIdForProfile(profileId);

  const [
    pendingConfirmations,
    todaysCheckIns,
    todaysCheckOuts,
    confirmedBookings,
    completedBookings,
    totalBookings,
    revenueToday,
    revenueThisMonth,
  ] = await Promise.all([
    countByStatus(hotelId, "paid"),
    countCheckInsToday(hotelId),
    countCheckOutsToday(hotelId),
    countByStatus(hotelId, "confirmed"),
    countByStatus(hotelId, "completed"),
    countTotal(hotelId),
    revenueSince(hotelId, startOfDay()),
    revenueSince(hotelId, startOfMonth()),
  ]);

  return {
    pendingConfirmations,
    todaysCheckIns,
    todaysCheckOuts,
    confirmedBookings,
    completedBookings,
    totalBookings,
    revenueToday,
    revenueThisMonth,
  };
}

export async function getRecentActivity(profileId: string) {
  const hotelId = await getHotelIdForProfile(profileId);
  const [recent, arrivals] = await Promise.all([
    recentBookings(hotelId, 8),
    upcomingArrivals(hotelId, 8),
  ]);
  return { recentBookings: recent, upcomingArrivals: arrivals };
}

/** Booking counts per status, for the status distribution donut/bar chart. */
export async function getBookingStatusChart(profileId: string) {
  const hotelId = await getHotelIdForProfile(profileId);
  const rows = await db
    .select({ status: hotelOrders.status, count: sql<number>`count(*)::int` })
    .from(hotelOrders)
    .where(eq(hotelOrders.hotelId, hotelId))
    .groupBy(hotelOrders.status);

  return rows.map((r) => ({ status: r.status, count: r.count }));
}

/** Daily revenue for the last 14 days, for the dashboard revenue chart. */
export async function getRevenueChart(profileId: string) {
  const hotelId = await getHotelIdForProfile(profileId);
  const since = new Date();
  since.setDate(since.getDate() - 13);
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      day: sql<string>`to_char(${hotelOrders.paidAt}, 'YYYY-MM-DD')`,
      total: sql<string>`coalesce(sum(${hotelOrders.amount}), 0)`,
    })
    .from(hotelOrders)
    .where(
      and(
        eq(hotelOrders.hotelId, hotelId),
        sql`${hotelOrders.status} in ('paid', 'confirmed', 'completed')`,
        gte(hotelOrders.paidAt, since)
      )
    )
    .groupBy(sql`to_char(${hotelOrders.paidAt}, 'YYYY-MM-DD')`);

  const byDay = new Map(rows.map((r) => [r.day, Number(r.total)]));
  const series: { date: string; revenue: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: key, revenue: byDay.get(key) ?? 0 });
  }
  return series;
}
