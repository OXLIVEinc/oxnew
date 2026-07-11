/**
 * server/modules/hotel/room-types/room-types.repository.ts
 * -------------------------------------------------------------------------
 */
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db } from "@/config/database";
import { hotelOrders, hotelRoomTypes } from "@shared/schema";

export async function listRoomTypes(hotelId: string) {
  return db
    .select()
    .from(hotelRoomTypes)
    .where(eq(hotelRoomTypes.hotelId, hotelId))
    .orderBy(hotelRoomTypes.sortOrder, hotelRoomTypes.createdAt);
}

export async function getRoomType(hotelId: string, roomTypeId: string) {
  const [row] = await db
    .select()
    .from(hotelRoomTypes)
    .where(and(eq(hotelRoomTypes.id, roomTypeId), eq(hotelRoomTypes.hotelId, hotelId)))
    .limit(1);
  return row ?? null;
}

/** Rooms currently occupied (an active stay covering "now") per room type. */
export async function occupancyByRoomType(roomTypeIds: string[]): Promise<Record<string, number>> {
  if (roomTypeIds.length === 0) return {};
  const now = new Date();
  const rows = await db
    .select({ roomTypeId: hotelOrders.roomTypeId, count: sql<number>`count(*)::int` })
    .from(hotelOrders)
    .where(
      and(
        inArray(hotelOrders.roomTypeId, roomTypeIds),
        eq(hotelOrders.status, "confirmed"),
        lte(hotelOrders.checkIn, now),
        gte(hotelOrders.checkOut, now)
      )
    )
    .groupBy(hotelOrders.roomTypeId);

  return Object.fromEntries(rows.map((r) => [r.roomTypeId, r.count]));
}

/** Confirmed bookings for a room type that haven't checked in yet. */
export async function upcomingByRoomType(roomTypeIds: string[]): Promise<Record<string, number>> {
  if (roomTypeIds.length === 0) return {};
  const now = new Date();
  const rows = await db
    .select({ roomTypeId: hotelOrders.roomTypeId, count: sql<number>`count(*)::int` })
    .from(hotelOrders)
    .where(and(inArray(hotelOrders.roomTypeId, roomTypeIds), eq(hotelOrders.status, "confirmed"), gte(hotelOrders.checkIn, now)))
    .groupBy(hotelOrders.roomTypeId);

  return Object.fromEntries(rows.map((r) => [r.roomTypeId, r.count]));
}

export async function hasActiveBookings(roomTypeId: string): Promise<boolean> {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hotelOrders)
    .where(
      and(
        eq(hotelOrders.roomTypeId, roomTypeId),
        inArray(hotelOrders.status, ["pending", "awaiting_payment", "paid", "confirmed"])
      )
    );
  return (row?.count ?? 0) > 0;
}
