/**
 * Chat with the bot right in your terminal.
 *
 *   npm run simulate
 *
 * Special commands (simulate things the real system does automatically):
 *   SUBMIT <name1>/<email1>;<name2>/<email2>   -> simulates the checkout view submitting attendee details
 *   PAY_CONFIRM                                -> simulates Paystack confirming the last ticket order
 *   PAY_CONFIRM_HOTEL                          -> simulates Paystack confirming the last hotel order
 *   HOTEL_CONFIRM                               -> simulates the hotel partner accepting the last paid booking
 *   HOTEL_DECLINE                               -> simulates the hotel partner declining the last paid booking
 *   CLAIM <code> <full name> <email>           -> simulates the recipient confirming a ticket transfer
 *   DECLINE <code>                             -> simulates the recipient declining a ticket transfer
 *   EXIT                                       -> quit
 */
import 'dotenv/config';
import * as readline from 'readline';
import { handleMessage } from '../bot/router';
import { getSession } from '../bot/session';
import { completeTicketOrderPayment, completeHotelOrderPayment } from '../bot/payments';
import * as db from '../data/db';
import { BotReply } from '../types';

const PHONE = process.env.SIMULATE_PHONE || '2348100000001'; // pretend this is "you"

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('='.repeat(70));
console.log('OX Bot Simulator — type messages as if you were the buyer.');
console.log(`You are: ${PHONE}`);
console.log('Try: "Hi"  or  "OX-AFROBEATS-NIGHT-2026-A1B2C3"');
console.log('Special: SUBMIT | PAY_CONFIRM | PAY_CONFIRM_HOTEL | HOTEL_CONFIRM | HOTEL_DECLINE | CLAIM | DECLINE | EXIT');
console.log('NOTE: ticket delivery + hotel/referral nudges are handled by the');
console.log('      queue worker — run `npm run worker` in another terminal to see them.');
console.log('='.repeat(70));

function printReply(result: BotReply): void {
  if (result.reply) {
    console.log(`\nBot:\n${result.reply}`);
  } else {
    console.log('\n[No reply]');
  }
  if (result.cta) {
    console.log(`\nBot (button): [${result.cta.buttonText}] ${result.cta.url}`);
  }
  if (result.followUp) {
    console.log(`\nBot (follow-up):\n${result.followUp}`);
  }
}

async function handleSpecial(rawUpper: string, raw: string): Promise<boolean> {
  if (rawUpper === 'EXIT') {
    rl.close();
    return true;
  }

  if (rawUpper.startsWith('SUBMIT')) {
    const session = await getSession(PHONE);
    const orderId = session.context.orderId;
    if (!orderId) {
      console.log('\n[No pending ticket order on this session]');
      return true;
    }
    const payload = raw.slice('SUBMIT'.length).trim();
    const items = payload
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((pair) => {
        const [attendeeName, attendeeEmail] = pair.split('/').map((p) => p.trim());
        return { attendeeName, attendeeEmail };
      });
    try {
      const updated = await db.submitOrderItems(orderId, items);
      console.log(`\n[Checkout submitted. Pay here: ${updated.authorizationUrl}]`);
      console.log('[Now type PAY_CONFIRM to simulate the Paystack webhook]');
    } catch (err) {
      console.log(`\n[Error: ${(err as Error).message}]`);
    }
    return true;
  }

  if (rawUpper === 'PAY_CONFIRM') {
    const session = await getSession(PHONE);
    const orderId = session.context.orderId;
    if (!orderId) {
      console.log('\n[No pending ticket order on this session]');
      return true;
    }
    const order = await db.getTicketOrderById(orderId);
    if (!order) {
      console.log('\n[Order not found]');
      return true;
    }
    await completeTicketOrderPayment(order.reference);
    console.log('\n[Payment confirmed — check the WhatsApp delivery message above]');
    return true;
  }

  if (rawUpper === 'PAY_CONFIRM_HOTEL') {
    const session = await getSession(PHONE);
    const orderId = session.context.hotelOrderId;
    if (!orderId) {
      console.log('\n[No pending hotel order on this session]');
      return true;
    }
    const order = await db.getHotelOrderById(orderId);
    if (!order) {
      console.log('\n[Order not found]');
      return true;
    }
    await completeHotelOrderPayment(order.reference);
    console.log('\n[Payment confirmed — check the WhatsApp delivery message above]');
    return true;
  }

  if (rawUpper === 'HOTEL_CONFIRM' || rawUpper === 'HOTEL_DECLINE') {
    const session = await getSession(PHONE);
    const orderId = session.context.hotelOrderId;
    if (!orderId) {
      console.log('\n[No hotel order on this session]');
      return true;
    }
    const order = await db.getHotelOrderById(orderId);
    if (!order) {
      console.log('\n[Order not found]');
      return true;
    }
    const hotel = await db.getHotelById(order.hotelId);
    if (!hotel) {
      console.log('\n[Hotel not found]');
      return true;
    }
    const action = rawUpper === 'HOTEL_CONFIRM' ? 'CONFIRM' : 'DECLINE';
    console.log(`\n[Simulating hotel (${hotel.whatsappNumber}) replying "${action} ${order.reference}"]`);
    const result = await handleMessage(hotel.whatsappNumber, `${action} ${order.reference}`);
    printReply(result);
    return true;
  }

  if (rawUpper.startsWith('CLAIM ')) {
    const parts = raw.slice(6).trim().split(' ');
    const code = parts[0];
    const email = parts[parts.length - 1];
    const fullName = parts.slice(1, -1).join(' ');
    try {
      const { transfer, ticket } = await db.claimTransfer(code, fullName, email);
      console.log(`\n[Transfer claimed by ${fullName}. New ticket ref: ${ticket.checkInCode}]`);
      console.log(`[Notify sender (profile ${transfer.fromUserId}) and recipient ${transfer.recipientPhone} — see WhatsApp messages above]`);
    } catch (err) {
      console.log(`\n[Error: ${(err as Error).message}]`);
    }
    return true;
  }

  if (rawUpper.startsWith('DECLINE ')) {
    const code = raw.slice(8).trim();
    try {
      await db.declineTransfer(code);
      console.log(`\n[Transfer ${code} declined]`);
    } catch (err) {
      console.log(`\n[Error: ${(err as Error).message}]`);
    }
    return true;
  }

  return false;
}

function prompt(): void {
  rl.question('\nYou: ', async (input: string) => {
    const raw = input.trim();
    const rawUpper = raw.toUpperCase();

    const handled = await handleSpecial(rawUpper, raw);
    if (rawUpper === 'EXIT') return;
    if (!handled) {
      const result = await handleMessage(PHONE, raw);
      printReply(result);
    }

    prompt();
  });
}

prompt();
