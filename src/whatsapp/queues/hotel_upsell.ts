import * as db from "../data/db";
import { sendMessage } from "../bot/messenger";
import { naira } from "../bot/helpers";
import { getSession, setState } from "../bot/session";

/**
 * Step 6 — Hotel Upsell (30–60 seconds post-purchase). Suggests up to 3
 * approved hotels closest to the event venue and lets the buyer tap a
 * number to jump straight into a booking, or reply SKIP.
 */
export async function handleHotelUpsell(orderId: string): Promise<void> {
  const order = await db.getTicketOrderById(orderId);
  if (!order) throw new Error(`ORDER_NOT_FOUND: ${orderId}`);
  if (order.status !== "paid") return;
  if (order.hotelUpsellSentAt) return;

  const event = await db.getEventById(order.eventId);
  if (!event) throw new Error(`EVENT_NOT_FOUND: ${order.eventId}`);

  const recommendations = await db.recommendHotelsNearEvent(event.id, 3);

  if (recommendations.length === 0) {
    await db.markHotelUpsellSent(order.id);
    return; // nothing nearby to offer — skip silently, don't spam the buyer
  }

  const profile = await db.getOrCreateProfile(order.phone);
  const firstName = profile.displayName?.split(" ")[0] || "there";

  const lines = recommendations
    .map((h, i) => `${i + 1}. ${h.name} - ${naira(h.pricePerNight)}/night (${h.distanceKm.toFixed(1)}km)`)
    .join("\n");

  await sendMessage(
    order.phone,
    `Hi ${firstName}, need a place to stay near the venue?\n\n` +
      `Here are hotels within reach of ${event.address}:\n\n` +
      `${lines}\n\n` +
      `Tap a number to book, or reply SKIP.`
  );

  const session = await getSession(order.phone);
  if (session.state === "MAIN_MENU" || session.state === "FRESH") {
    await setState(order.phone, "HOTEL_UPSELL_OFFER", {
      hotelUpsellOffers: recommendations.map((h) => ({
        id: h.id,
        name: h.name,
        pricePerNight: h.pricePerNight,
        distanceKm: h.distanceKm,
      })),
      hotelUpsellEventId: event.id,
    });
  }

  await db.markHotelUpsellSent(order.id);
}
