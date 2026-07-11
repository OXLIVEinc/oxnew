/**
 * server/modules/hotel/bookings/bookings.service.ts
 * -------------------------------------------------------------------------
 * Status transitions reuse the exact same mutations the WhatsApp bot uses
 * (modules/whatsapp/data/db.ts) so there is one source of truth for what
 * "confirm" / "decline" actually do to a hotel_orders row, regardless of
 * whether the hotel replied on WhatsApp or clicked a button here. Every
 * mutation also calls into hotel.events.ts, which is what actually pushes
 * the Socket.IO event + notification — so both channels stay in sync.
 * -------------------------------------------------------------------------
 */
import { and, eq } from "drizzle-orm";
import { db } from "@/config/database";
import { hotelOrders, type HotelOrder } from "@shared/schema";
import { AppError } from "@/middleware/error.middleware";
import { getHotelIdForProfile } from "../hotel.access";
import {
  confirmHotelOrder,
  declineHotelOrder,
} from "@/modules/whatsapp/data/db";
import * as hotelEvents from "../hotel.events";
import * as repo from "./bookings.repository";
import type { BookingAction, BookingListParams } from "./bookings.types";

export function getValidActions(status: string, checkedIn: boolean): BookingAction[] {
  switch (status) {
    case "paid":
      return ["confirm", "decline"];
    case "confirmed":
      return checkedIn ? ["complete"] : ["check_in", "complete"];
    default:
      return [];
  }
}

function serialize<T extends { status: string; checkedIn: boolean }>(row: T) {
  return { ...row, validActions: getValidActions(row.status, row.checkedIn) };
}

export async function listBookings(profileId: string, params: BookingListParams) {
  const hotelId = await getHotelIdForProfile(profileId);
  const result = await repo.findBookings(hotelId, params);
  return { ...result, bookings: result.bookings.map(serialize) };
}

function buildTimeline(row: {
  createdAt: Date;
  paidAt: Date | null;
  updatedAt: Date;
  declinedAt: Date | null;
  cancelledAt: Date | null;
  status: string;
}, checkedIn: boolean) {
  const events: { label: string; at: Date }[] = [{ label: "Booking created", at: row.createdAt }];
  if (row.paidAt) events.push({ label: "Payment received", at: row.paidAt });
  if (row.status === "confirmed" || row.status === "completed") {
    events.push({ label: "Booking confirmed", at: row.updatedAt });
  }
  if (checkedIn) events.push({ label: "Guest checked in", at: row.updatedAt });
  if (row.status === "completed") events.push({ label: "Stay completed", at: row.updatedAt });
  if (row.declinedAt) events.push({ label: "Booking declined", at: row.declinedAt });
  if (row.cancelledAt) events.push({ label: "Booking cancelled", at: row.cancelledAt });
  return events.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export async function getBookingDetail(profileId: string, orderId: string) {
  const hotelId = await getHotelIdForProfile(profileId);
  const row = await repo.findBookingById(hotelId, orderId);
  if (!row) throw AppError.notFound("Booking not found");

  const checkedIn = await repo.isCheckedIn(orderId);
  const booking = serialize({ ...row, checkedIn });

  return {
    ...booking,
    // hotel_orders has no free-text "special requests" column today.
    specialRequests: null as string | null,
    timeline: buildTimeline(row, checkedIn),
  };
}

async function loadOwnedOrder(hotelId: string, orderId: string): Promise<HotelOrder> {
  const [row] = await db
    .select()
    .from(hotelOrders)
    .where(and(eq(hotelOrders.id, orderId), eq(hotelOrders.hotelId, hotelId)))
    .limit(1);
  if (!row) throw AppError.notFound("Booking not found");
  return row;
}

export async function confirmBooking(profileId: string, orderId: string) {
  const hotelId = await getHotelIdForProfile(profileId);
  const order = await loadOwnedOrder(hotelId, orderId);
  if (order.status !== "paid") {
    throw AppError.conflict(`Booking cannot be confirmed from status "${order.status}"`);
  }

  const updated = await confirmHotelOrder(orderId);
  await hotelEvents.notifyBookingConfirmed(updated);

  return getBookingDetail(profileId, orderId);
}

export async function declineBooking(profileId: string, orderId: string) {
  const hotelId = await getHotelIdForProfile(profileId);
  const order = await loadOwnedOrder(hotelId, orderId);
  if (order.status !== "paid") {
    throw AppError.conflict(`Booking cannot be declined from status "${order.status}"`);
  }

  const updated = await declineHotelOrder(orderId);
  await hotelEvents.notifyBookingDeclined(updated);

  return getBookingDetail(profileId, orderId);
}

export async function markCheckedIn(profileId: string, orderId: string) {
  const hotelId = await getHotelIdForProfile(profileId);
  const order = await loadOwnedOrder(hotelId, orderId);
  if (order.status !== "confirmed") {
    throw AppError.conflict(`Booking must be confirmed before check-in (current status "${order.status}")`);
  }

  await repo.recordCheckIn(orderId, profileId, order.reference);
  await hotelEvents.notifyBookingUpdated(order, { checkedIn: true });

  return getBookingDetail(profileId, orderId);
}

export async function markCompleted(profileId: string, orderId: string) {
  const hotelId = await getHotelIdForProfile(profileId);
  const order = await loadOwnedOrder(hotelId, orderId);
  if (order.status !== "confirmed") {
    throw AppError.conflict(`Booking must be confirmed before it can be completed (current status "${order.status}")`);
  }

const now = new Date();

const [updated] = await db
  .update(hotelOrders)
  .set({
    status: "completed",
    completedAt: now,
    updatedAt: now,
  })
  .where(eq(hotelOrders.id, orderId))
  .returning();

  await hotelEvents.notifyBookingCompleted(updated);

  return getBookingDetail(profileId, orderId);
}
