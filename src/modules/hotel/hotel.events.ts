/**
 * server/modules/hotel/hotel.events.ts
 * -------------------------------------------------------------------------
 * Single place that turns a `hotel_orders` change into:
 *   1) a `notifications` row for the owning hotel partner's profile
 *   2) a Socket.IO event delivered only into that hotel's room
 *
 * Called both from this module's own booking actions (see
 * bookings/bookings.service.ts) and from the WhatsApp bot's data layer
 * (modules/whatsapp/data/db.ts) so a booking looks the same on the
 * dashboard no matter which channel changed it — one code path, no
 * duplicated notify/emit logic scattered across the app.
 *
 * Never throws: a notification/emit failure must never break the booking
 * flow that triggered it.
 * -------------------------------------------------------------------------
 */
import { eq } from "drizzle-orm";
import { db } from "@/config/database";
import { hotelPartners, notifications, type HotelOrder } from "@shared/schema";
import { emitToHotel, type HotelSocketEvent } from "@/lib/socket";

async function getOwnerProfileId(hotelId: string): Promise<string | null> {
  const [hotel] = await db
    .select({ userId: hotelPartners.userId })
    .from(hotelPartners)
    .where(eq(hotelPartners.id, hotelId))
    .limit(1);
  return hotel?.userId ?? null;
}

async function publish(
  hotelId: string,
  event: HotelSocketEvent,
  payload: Record<string, unknown>,
  notify?: { title: string; message: string }
): Promise<void> {
  try {
    const ownerProfileId = await getOwnerProfileId(hotelId);
    if (!ownerProfileId) return;

    emitToHotel(ownerProfileId, event, payload);

    if (notify) {
      await db.insert(notifications).values({
        userId: ownerProfileId,
        title: notify.title,
        message: notify.message,
        type: "hotel_booking",
      });
      emitToHotel(ownerProfileId, "hotel.notification.created", {
        ...notify,
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error("[hotel.events] failed to publish", event, err);
  }
}

function summary(order: HotelOrder) {
  return { id: order.id, status: order.status, reference: order.reference, hotelId: order.hotelId };
}

export async function notifyBookingCreated(order: HotelOrder): Promise<void> {
  await publish(order.hotelId, "hotel.booking.created", summary(order));
}

export async function notifyBookingPaid(order: HotelOrder): Promise<void> {
  await publish(order.hotelId, "hotel.booking.updated", summary(order), {
    title: "New booking awaiting confirmation",
    message: `Booking ${order.reference} was paid and now needs your confirmation.`,
  });
}

export async function notifyBookingConfirmed(order: HotelOrder): Promise<void> {
  await publish(order.hotelId, "hotel.booking.confirmed", summary(order));
  await publish(order.hotelId, "hotel.booking.updated", summary(order));
}

export async function notifyBookingDeclined(order: HotelOrder): Promise<void> {
  await publish(order.hotelId, "hotel.booking.declined", summary(order));
  await publish(order.hotelId, "hotel.booking.updated", summary(order));
}

export async function notifyBookingCompleted(order: HotelOrder): Promise<void> {
  await publish(order.hotelId, "hotel.booking.completed", summary(order), {
    title: "Stay completed",
    message: `Booking ${order.reference} was marked completed.`,
  });
  await publish(order.hotelId, "hotel.booking.updated", summary(order));
}

export async function notifyBookingCancelled(order: HotelOrder): Promise<void> {
  await publish(order.hotelId, "hotel.booking.cancelled", summary(order), {
    title: "Booking cancelled",
    message: `Booking ${order.reference} was cancelled by the guest.`,
  });
}

export async function notifyBookingUpdated(order: HotelOrder, extra?: Record<string, unknown>): Promise<void> {
  await publish(order.hotelId, "hotel.booking.updated", { ...summary(order), ...extra });
}
