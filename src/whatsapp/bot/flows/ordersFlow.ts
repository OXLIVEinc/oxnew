import * as db from '../../data/db';
import { FlowResult, ConversationContext } from '../../types';
import { formatDate, naira } from '../helpers';

const PAGE_SIZE = db.PAGE_SIZE;

/**
 * Shows one page (10 at a time) of the buyer's tickets and/or hotel
 * bookings, depending on what they picked at the "My bookings" kind
 * prompt. Reply MORE to page through the rest, exactly like event/hotel
 * browsing.
 */
export async function showBookings(
  phone: string,
  kind: ConversationContext['bookingKind'] = 'both',
  offset = 0
): Promise<FlowResult> {
  const overview = await db.getBookingsOverview(phone, offset, PAGE_SIZE);

  const showTickets = kind === 'tickets' || kind === 'both';
  const showHotels = kind === 'hotel' || kind === 'both';

  const noTickets = !showTickets || overview.tickets.length === 0;
  const noHotels = !showHotels || overview.hotelOrders.length === 0;

  if (noTickets && noHotels && offset === 0) {
    return {
      nextState: 'MAIN_MENU',
      reply: `You don't have any bookings yet. Type MENU to browse events or book a hotel.`,
    };
  }

  let reply = offset === 0 ? `Your bookings:\n\n` : `More bookings:\n\n`;

  if (showTickets && overview.tickets.length > 0) {
    reply += `TICKETS\n`;
    reply += overview.tickets
      .map(
        (t) =>
          `- ${t.eventName} - ${t.tierLabel}\n  Name: ${t.attendeeName} | Ref: ${t.checkInCode} | Status: ${t.status}`
      )
      .join('\n');
    reply += `\n\n`;
  }

  if (showHotels && overview.hotelOrders.length > 0) {
    reply += `HOTELS\n`;
    reply += overview.hotelOrders
      .map(
        (h) =>
          `- ${h.hotelName} - ${h.roomTypeName}\n  ${formatDate(h.checkIn)} to ${formatDate(h.checkOut)} | Ref: ${h.reference} | Status: ${h.status}`
      )
      .join('\n');
    reply += `\n\n`;
  }

  if (overview.hasMore) {
    reply += `Reply MORE to see more, or type MENU for options.\n`;
  }
  reply += `Type PENDING to view and cancel anything awaiting payment or confirmation.`;

  return {
    nextState: 'CHECK_BOOKINGS',
    contextPatch: { bookingKind: kind, ordersOffset: overview.nextOffset },
    reply,
  };
}

/**
 * Lists everything the buyer can still manually cancel (not yet paid, or
 * paid and awaiting the hotel's confirmation) instead of waiting for the
 * Supabase cron job to expire it. Works from any state — see router.ts.
 */
export async function showPending(phone: string): Promise<FlowResult> {
  const pending = await db.getPendingItemsForUser(phone);

  const nothingPending =
    pending.ticketOrders.length === 0 && pending.hotelOrders.length === 0 && pending.transfers.length === 0;

  if (nothingPending) {
    return { reply: `You don't have anything pending right now. Type MENU for options.` };
  }

  let reply = `Pending items:\n\n`;

  if (pending.ticketOrders.length > 0) {
    reply += `TICKET ORDERS\n`;
    reply += pending.ticketOrders
      .map(
        (o) =>
          `- ${o.eventName}\n  Ref: ${o.reference} | ${naira(Number(o.amount))} | Status: ${o.status}`
      )
      .join('\n');
    reply += `\n\n`;
  }

  if (pending.hotelOrders.length > 0) {
    reply += `HOTEL BOOKINGS\n`;
    reply += pending.hotelOrders
      .map(
        (o) =>
          `- ${o.hotelName}\n  Ref: ${o.reference} | ${naira(Number(o.amount))} | Status: ${o.status}`
      )
      .join('\n');
    reply += `\n\n`;
  }

  if (pending.transfers.length > 0) {
    reply += `OUTGOING TICKET TRANSFERS\n`;
    reply += pending.transfers
      .map((t) => `- ${t.eventName}\n  Code: ${t.transferCode} | To: ${t.recipientPhone}`)
      .join('\n');
    reply += `\n\n`;
  }

  reply += `To cancel any of these, reply CANCEL followed by the reference or code, e.g. CANCEL ${
    pending.ticketOrders[0]?.reference || pending.hotelOrders[0]?.reference || pending.transfers[0]?.transferCode
  }.\n\nType MENU for options.`;

  return { reply };
}

/**
 * Handles a "CANCEL <reference>" command. Tries a ticket order, then a
 * hotel order, then an outgoing transfer, since references/codes are
 * generated from separate sequences and won't collide.
 */
export async function cancelPendingItem(phone: string, referenceOrCode: string): Promise<FlowResult> {
  try {
    const order = await db.cancelTicketOrderForUser(phone, referenceOrCode);
    return { reply: `Ticket order ${order.reference} has been cancelled. Type MENU for options.` };
  } catch {
    // not a ticket order (or not this buyer's) - fall through
  }

  try {
    const order = await db.cancelHotelOrderForUser(phone, referenceOrCode);
    return { reply: `Hotel booking ${order.reference} has been cancelled. Type MENU for options.` };
  } catch {
    // not a hotel order (or not this buyer's) - fall through
  }

  try {
    const transfer = await db.cancelTransferForUser(phone, referenceOrCode);
    return { reply: `Ticket transfer ${transfer.transferCode} has been cancelled. The ticket remains yours. Type MENU for options.` };
  } catch {
    // not a transfer either
  }

  return {
    reply:
      `We couldn't find a pending order, booking, or transfer matching "${referenceOrCode}".\n\n` +
      `Type PENDING to see what you can cancel.`,
  };
}
