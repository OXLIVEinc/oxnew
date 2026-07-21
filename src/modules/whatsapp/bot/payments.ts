import * as db from '../data/db';
import { getSession, setState } from './session';
import * as hotelFlow from './flows/hotelFlow';
import { sendMessage } from './messenger';
import {
  enqueueHotelUpsell,
  enqueueReferralUpsell,
  enqueuePreEventReminder,
} from '../queues/purchase';
import { handleTicketDelivery } from '../queues/ticket_confirmation';

/**
 * Called from the Paystack webhook. Independent of the buyer's current
 * WhatsApp session — a payment can confirm long after they've closed the
 * chat. `reference` is checked against `processed_payments` first so a
 * webhook retry (Paystack resends on any non-2xx) can never double-fulfil
 * an order.
 */
export async function completeTicketOrderPayment(
  reference: string,
  amountKobo?: number
): Promise<void> {
  const order = await db.findTicketOrderByReference(reference);

  if (!order) {
    console.warn(`[payments] no ticket order found for reference ${reference}`);
    return;
  }

  const isNewPayment = await db.recordProcessedPaymentIfNew({
    reference,
    paymentType: "ticket",
    userId: order.userId,
    ticketOrderId: order.id,
    amount: amountKobo != null ? amountKobo / 100 : Number(order.amount),
  });

  if (!isNewPayment) return;

  if (order.status !== "paid") {
    await db.markTicketOrderPaid(order.id);
  }

  // Generate tickets for both web and WhatsApp orders.
  await db.createTicketsForOrder(order);

  // Web orders stop here.
  if (order.orderSource === "web") {
    return;
  }

  // WhatsApp-specific post-purchase flow.
  await handleTicketDelivery(order.id);
  await enqueueHotelUpsell(order.id);
  await enqueueReferralUpsell(order.id);

  const event = await db.getEventById(order.eventId);
  if (event) {
    await enqueuePreEventReminder(order.id, event.startsAt);
  }

  const session = await getSession(order.phone);
  if (
    session.state === "EVENT_CHECKOUT_PENDING" &&
    session.context.orderId === order.id
  ) {
    await setState(order.phone, "MAIN_MENU", {});
  }
}


export async function completeFreeTicketOrder(reference: string): Promise<void> {
  const order = await db.findTicketOrderByReference(reference);

  if (!order) {
    console.warn(`[tickets] no ticket order found for reference ${reference}`);
    return;
  }

  if (order.status !== 'paid') {
    await db.markTicketOrderPaid(order.id);
  }

  await db.createTicketsForOrder(order);

  // Web orders stop here.
  if (order.orderSource === 'web') {
    return;
  }

  // WhatsApp-specific flow.
  await handleTicketDelivery(order.id);
  await enqueueHotelUpsell(order.id);
  await enqueueReferralUpsell(order.id);

  const event = await db.getEventById(order.eventId);
  if (event) {
    await enqueuePreEventReminder(order.id, event.startsAt);
  }

  const session = await getSession(order.phone);
  if (
    session.state === 'EVENT_CHECKOUT_PENDING' &&
    session.context.orderId === order.id
  ) {
    await setState(order.phone, 'MAIN_MENU', {});
  }
}

export async function completeHotelOrderPayment(reference: string, amountKobo?: number): Promise<void> {
  const order = await db.findHotelOrderByReference(reference);
  if (!order) {
    console.warn(`[payments] no hotel order found for reference ${reference}`);
    return;
  }

  const isFree = Number(order.amount) === 0;

  const isNewPayment = await db.recordProcessedPaymentIfNew({
    reference,
    paymentType: 'hotel',
    userId: order.userId,
    hotelOrderId: order.id,
    amount: amountKobo != null ? amountKobo / 100 : Number(order.amount),
  });
  if (!isNewPayment) return;

  // Payment clears the order into "paid" — it isn't "confirmed" until the
  // hotel itself accepts the request (see hotelFlow.notifyHotelOfBooking /
  // db.confirmHotelOrder / db.declineHotelOrder, wired up in router.ts).
  if (order.status !== 'paid' && order.status !== 'confirmed' && order.status !== 'declined' && order.status !== 'completed') {
    const paid = await db.markHotelOrderPaid(order.id);
    await sendMessage(
      paid.phone,
      isFree
        ? `Your booking request (Ref: ${paid.reference}) has been registered.\n\n` +
          `We've sent it to the hotel — you'll get a confirmation here shortly (within 30 minutes).`
        : `Payment received for Ref: ${paid.reference}.\n\n` +
          `We've sent your request to the hotel — you'll get a confirmation here shortly (within 30 minutes).`
    );
    await hotelFlow.notifyHotelOfBooking(paid);
  }

  const session = await getSession(order.phone);
  if (session.state === 'HOTEL_ORDER_PENDING' && session.context.hotelOrderId === order.id) {
    await setState(order.phone, 'MAIN_MENU', {});
  }
}
