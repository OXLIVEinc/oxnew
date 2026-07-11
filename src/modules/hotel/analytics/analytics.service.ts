/**
 * server/modules/hotel/analytics/analytics.service.ts
 * -------------------------------------------------------------------------
 */
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/config/database";
import { hotelOrders, hotelRoomTypes } from "@shared/schema";
import { getHotelIdForProfile } from "../hotel.access";
import { lte } from "drizzle-orm";

const REVENUE_STATUSES = sql`${hotelOrders.status} in ('paid', 'confirmed', 'completed')`;

export async function getRevenueByMonth(profileId: string, months = 6) {
  const hotelId = await getHotelIdForProfile(profileId);
  const since = new Date();
  since.setMonth(since.getMonth() - (months - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      month: sql<string>`to_char(${hotelOrders.paidAt}, 'YYYY-MM')`,
      revenue: sql<string>`coalesce(sum(${hotelOrders.amount}), 0)`,
      bookings: sql<number>`count(*)::int`,
    })
    .from(hotelOrders)
    .where(and(eq(hotelOrders.hotelId, hotelId), REVENUE_STATUSES, gte(hotelOrders.paidAt, since)))
    .groupBy(sql`to_char(${hotelOrders.paidAt}, 'YYYY-MM')`);

  const byMonth = new Map(rows.map((r) => [r.month, r]));
  const series: { month: string; revenue: number; bookings: number }[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(since);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const row = byMonth.get(key);
    series.push({ month: key, revenue: Number(row?.revenue ?? 0), bookings: row?.bookings ?? 0 });
  }
  return series;
}

export async function getOccupancyRate(profileId: string) {
  const hotelId = await getHotelIdForProfile(profileId);

  const [roomTotals] = await db
    .select({ totalRooms: sql<number>`coalesce(sum(${hotelRoomTypes.quantity}), 0)` })
    .from(hotelRoomTypes)
    .where(eq(hotelRoomTypes.hotelId, hotelId));

  const totalRooms = roomTotals?.totalRooms ?? 0;
  if (totalRooms === 0) return { occupancyRate: 0, occupiedRooms: 0, totalRooms: 0 };

  const now = new Date();
  const [occupied] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hotelOrders).where(
  and(
    eq(hotelOrders.hotelId, hotelId),
    eq(hotelOrders.status, "confirmed"),
    lte(hotelOrders.checkIn, now),
    gte(hotelOrders.checkOut, now),
  )
)

  const occupiedRooms = occupied?.count ?? 0;
  return {
    occupancyRate: Math.round((occupiedRooms / totalRooms) * 100),
    occupiedRooms,
    totalRooms,
  };
}

export async function getAverageStayLength(profileId: string) {
  const hotelId = await getHotelIdForProfile(profileId);
  const [row] = await db
    .select({ avgNights: sql<string>`coalesce(avg(${hotelOrders.nights}), 0)` })
    .from(hotelOrders)
    .where(and(eq(hotelOrders.hotelId, hotelId), REVENUE_STATUSES));
  return Math.round(Number(row?.avgNights ?? 0) * 10) / 10;
}

export async function getMostBookedRoomType(profileId: string) {
  const hotelId = await getHotelIdForProfile(profileId);
  const [row] = await db
    .select({ roomTypeName: hotelOrders.roomTypeName, count: sql<number>`count(*)::int` })
    .from(hotelOrders)
    .where(and(eq(hotelOrders.hotelId, hotelId), REVENUE_STATUSES))
    .groupBy(hotelOrders.roomTypeName)
    .orderBy(sql`count(*) desc`)
    .limit(1);
  return row ?? null;
}

export async function getBookingStatusDistribution(profileId: string) {
  const hotelId = await getHotelIdForProfile(profileId);
  const rows = await db
    .select({ status: hotelOrders.status, count: sql<number>`count(*)::int` })
    .from(hotelOrders)
    .where(eq(hotelOrders.hotelId, hotelId))
    .groupBy(hotelOrders.status);
  return rows;
}

export async function getAnalyticsSummary(profileId: string) {
  const [revenueByMonth, occupancy, averageStayLength, mostBookedRoomType, statusDistribution] =
    await Promise.all([
      getRevenueByMonth(profileId),
      getOccupancyRate(profileId),
      getAverageStayLength(profileId),
      getMostBookedRoomType(profileId),
      getBookingStatusDistribution(profileId),
    ]);

  return {
    revenueByMonth,
    bookingsByMonth: revenueByMonth.map(({ month, bookings }) => ({ month, bookings })),
    occupancy,
    averageStayLength,
    mostBookedRoomType,
    statusDistribution,
  };
}
