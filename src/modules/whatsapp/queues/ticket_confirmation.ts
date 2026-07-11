import * as db from "../data/db";
import { sendMessage, sendImageMessage } from "../bot/messenger";
import { naira } from "../bot/helpers";
import { formatEventDateTime } from "../lib/datetime";

/**
 * Delivers each attendee's ticket (branded QR image + a text summary) right
 * after a ticket order is marked paid. Idempotent — safe to retry.
 */
export async function handleTicketDelivery(orderId: string): Promise<void> {
  const order = await db.getTicketOrderById(orderId);
  console.log(order)
  if (!order) throw new Error(`ORDER_NOT_FOUND: ${orderId}`);
  if (order.status !== "paid") return; // nothing to deliver yet
  if (order.ticketsDeliveredAt) return; // already delivered
  console.log('hiiiiiii')

  const [event, tickets] = await Promise.all([
    db.getEventById(order.eventId),
    db.getTicketsForOrder(order.id),
  ]);
  if (!event) throw new Error(`EVENT_NOT_FOUND: ${order.eventId}`);
  if (tickets.length === 0) throw new Error(`TICKETS_NOT_FOUND for order ${order.id}`);

  await sendMessage(
    order.phone,
    `Payment confirmed. Your ${tickets.length} ticket${tickets.length > 1 ? "s" : ""} for ${event.title} ${
      tickets.length > 1 ? "are" : "is"
    } below.\n\n` +
      `Save this chat - you'll show your QR code at the door.`
  );

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i];
    await sendImageMessage(
      order.phone,
      ticket.qrCode,
      `Ticket ${i + 1} of ${tickets.length} - ${event.title}\n` +
        `${formatEventDateTime(event.startsAt, event.endsAt)}\n` +
        `${event.address}\n` +
        `Name: ${ticket.attendeeName}\n` +
        `Ref: ${ticket.checkInCode}`
    );
  }

  await sendMessage(
    order.phone,
    `See you there.\n\nTotal paid: ${naira(Number(order.amount))} | Order Ref: ${order.reference}\n\n` +
      `Type MENU to explore more events on OX.`
  );

  await db.markTicketsDelivered(order.id);
}
