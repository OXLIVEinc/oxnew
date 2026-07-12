/**
 * server/modules/hotel/bookings/bookings.repository.ts
 * -------------------------------------------------------------------------
 * All raw Drizzle queries for hotel_orders live here. Every query is scoped
 * to a hotelId so a hotel partner can never see another hotel's bookings.
 * -------------------------------------------------------------------------
 */
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/config/database";
import { auditLogs, hotelOrders, profiles } from "@shared/schema";
import { TAB_STATUS_MAP, type BookingListParams } from "./bookings.types";

/** audit_logs.action value used to mark a confirmed booking's guest as checked in. */
export const CHECKED_IN_ACTION = "hotel_order_checked_in";

function bookingSelection() {
  return {
    id: hotelOrders.id,
    hotelId: hotelOrders.hotelId,
    userId: hotelOrders.userId,
    reference: hotelOrders.reference,
    status: hotelOrders.status,
    guestName: profiles.displayName,
    guestPhone: hotelOrders.phone,
    guestEmail: profiles.email,
    roomTypeId: hotelOrders.roomTypeId,
    roomTypeName: hotelOrders.roomTypeName,
    guests: hotelOrders.guests,
    checkIn: hotelOrders.checkIn,
    checkOut: hotelOrders.checkOut,
    nights: hotelOrders.nights,
    pricePerNight: hotelOrders.pricePerNight,
    subtotal: hotelOrders.subtotal,
    serviceFee: hotelOrders.serviceFee,
    amount: hotelOrders.amount,
    currency: hotelOrders.currency,
    paymentProvider: hotelOrders.paymentProvider,
    paystackReference: hotelOrders.paystackReference,
    createdAt: hotelOrders.createdAt,
    updatedAt: hotelOrders.updatedAt,
    paidAt: hotelOrders.paidAt,
    cancelledAt: hotelOrders.cancelledAt,
    declinedAt: hotelOrders.declinedAt,
    expiresAt: hotelOrders.expiresAt,
  };
}

function buildConditions(hotelId: string, params: BookingListParams): SQL[] {
  const conditions: SQL[] = [eq(hotelOrders.hotelId, hotelId)];

  if (params.tab) {
  conditions.push(inArray(hotelOrders.status, TAB_STATUS_MAP[params.tab]));
} else if (params.status) {
  conditions.push(eq(hotelOrders.status, params.status));
}
  if (params.roomTypeId) conditions.push(eq(hotelOrders.roomTypeId, params.roomTypeId));
  if (params.dateFrom) conditions.push(gte(hotelOrders.checkIn, new Date(params.dateFrom)));
  if (params.dateTo) conditions.push(lte(hotelOrders.checkOut, new Date(params.dateTo)));

  if (params.search) {
    const term = `%${params.search}%`;
    const clause = or(
      ilike(hotelOrders.reference, term),
      ilike(hotelOrders.phone, term),
      ilike(profiles.displayName, term)
    );
    if (clause) conditions.push(clause);
  }

  return conditions;
}

export async function findBookings(hotelId: string, params: BookingListParams) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const conditions = buildConditions(hotelId, params);

  const sortColumn =
    params.sortBy === "checkIn"
      ? hotelOrders.checkIn
      : params.sortBy === "checkOut"
      ? hotelOrders.checkOut
      : params.sortBy === "amount"
      ? hotelOrders.amount
      : hotelOrders.createdAt;
  const orderFn = params.sortDir === "asc" ? asc : desc;

  const [rows, countRows] = await Promise.all([
    db
      .select(bookingSelection())
      .from(hotelOrders)
      .leftJoin(profiles, eq(hotelOrders.userId, profiles.id))
      .where(and(...conditions))
      .orderBy(orderFn(sortColumn))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(hotelOrders)
      .leftJoin(profiles, eq(hotelOrders.userId, profiles.id))
      .where(and(...conditions)),
  ]);

  const total = countRows[0]?.count ?? 0;
  const checkedIn = await getCheckedInSet(rows.map((r) => r.id));

  return {
    bookings: rows.map((r) => ({ ...r, checkedIn: checkedIn.has(r.id) })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function findBookingById(hotelId: string, orderId: string) {
  const [row] = await db
    .select(bookingSelection())
    .from(hotelOrders)
    .leftJoin(profiles, eq(hotelOrders.userId, profiles.id))
    .where(and(eq(hotelOrders.id, orderId), eq(hotelOrders.hotelId, hotelId)))
    .limit(1);
  return row ?? null;
}

export async function getCheckedInSet(orderIds: string[]): Promise<Set<string>> {
  if (orderIds.length === 0) return new Set();
  const rows = await db
    .select({ entityId: auditLogs.entityId })
    .from(auditLogs)
    .where(and(eq(auditLogs.action, CHECKED_IN_ACTION), inArray(auditLogs.entityId, orderIds)));
  return new Set(rows.map((r) => r.entityId));
}

export async function isCheckedIn(orderId: string): Promise<boolean> {
  const set = await getCheckedInSet([orderId]);
  return set.has(orderId);
}

export async function recordCheckIn(
  orderId: string,
  actorProfileId: string,
  reference: string
) {
  const already = await isCheckedIn(orderId);

  if (!already) {
    await db.insert(auditLogs).values({
      actorId: actorProfileId,
      action: CHECKED_IN_ACTION,
      entityType: "hotel_order",
      entityId: orderId,
      metadata: { reference },
    });
  }

  const [order] = await db
    .select()
    .from(hotelOrders)
    .where(eq(hotelOrders.id, orderId))
    .limit(1);

  return order;
}

export async function recentBookings(hotelId: string, limit = 8) {
  const rows = await db
    .select(bookingSelection())
    .from(hotelOrders)
    .leftJoin(profiles, eq(hotelOrders.userId, profiles.id))
    .where(eq(hotelOrders.hotelId, hotelId))
    .orderBy(desc(hotelOrders.createdAt))
    .limit(limit);
  const checkedIn = await getCheckedInSet(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, checkedIn: checkedIn.has(r.id) }));
}

export async function upcomingArrivals(hotelId: string, limit = 8) {
  const now = new Date();
  const rows = await db
    .select(bookingSelection())
    .from(hotelOrders)
    .leftJoin(profiles, eq(hotelOrders.userId, profiles.id))
    .where(and(eq(hotelOrders.hotelId, hotelId), eq(hotelOrders.status, "confirmed"), gte(hotelOrders.checkIn, now)))
    .orderBy(asc(hotelOrders.checkIn))
    .limit(limit);
  return rows;
}
