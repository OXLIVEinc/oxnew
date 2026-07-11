import * as db from "../data/db";
import { sendMessage, sendImageMessage } from "../bot/messenger";
import { formatEventTimeRange } from "../lib/datetime";

/**
 * Step 8 — Pre-Event Reminder (T-24hrs). Re-sends each attendee's QR code
 * the day before the event so it's the last thing fresh in their chat.
 */
export async function handlePreEventReminder(orderId: string): Promise<void> {
  const order = await db.getTicketOrderById(orderId);
  if (!order) throw new Error(`ORDER_NOT_FOUND: ${orderId}`);
  if (order.status !== "paid") return;
  if (order.preEventReminderSentAt) return;

  const [event, tickets] = await Promise.all([
    db.getEventById(order.eventId),
    db.getTicketsForOrder(order.id),
  ]);
  if (!event) throw new Error(`EVENT_NOT_FOUND: ${order.eventId}`);
  if (tickets.length === 0) return;

  const profile = await db.getOrCreateProfile(order.phone);
  const firstName = profile.displayName?.split(" ")[0] || "there";
  const mapsLink = `https://maps.google.com/?q=${event.locationLat},${event.locationLng}`;

  await sendMessage(
    order.phone,
    `Hi ${firstName}, your event is tomorrow.\n\n` +
      `${event.title}\n` +
      `${event.title && new Date(event.startsAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} - ${formatEventTimeRange(event.startsAt, event.endsAt)}\n` +
      `${event.address}\n` +
      `${mapsLink}\n\n` +
      `Your QR code${tickets.length > 1 ? "s are" : " is"} below.\n\n` +
      `See you tonight.`
  );

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    await sendImageMessage(
      order.phone,
      ticket.qrCode,
      `${ticket.attendeeName} - Ref: ${ticket.checkInCode}`
    );
  }

  await db.markPreEventReminderSent(order.id);
}
