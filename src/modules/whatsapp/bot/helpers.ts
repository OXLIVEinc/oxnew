export { formatDate, formatEventDate, formatEventTimeRange, formatEventDateTime } from '../lib/datetime';
import { CtaUrlPayload } from '../types';

export function naira(amount: number): string {
  return '₦' + amount.toLocaleString('en-NG');
}

// Recognizes an OX deep-link event code, e.g. "OX-AFROBEATS-NIGHT-2026-A1B2C3"
export function isDeepLinkCode(text: string): boolean {
  return /^OX-[A-Z0-9-]+$/i.test(text.trim());
}

// Global commands that should work from ANY state
export function isGlobalCommand(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t === 'menu' || t === 'help' || t === 'pause' || t === 'resume' || t === 'pending';
}

// "MORE" (or "more" reply) re-queries the DB for the next page of whatever
// list is currently on screen (events, hotels, bookings, etc).
export function isMoreCommand(text: string): boolean {
  return text.trim().toLowerCase() === 'more';
}

// "CANCEL <reference>" manually cancels a pending ticket order, hotel
// order, or outgoing ticket transfer, instead of waiting on it to expire.
// Works from any state, so it doesn't collide with PAUSE (which stops a
// flow the buyer is mid-way through, not an order that already exists).
const CANCEL_ORDER_PATTERN = /^cancel\s+(\S+)$/i;
export function parseCancelOrderCommand(text: string): string | null {
  const match = text.trim().match(CANCEL_ORDER_PATTERN);
  return match ? match[1].toUpperCase() : null;
}

export function asNumberChoice(text: string, min: number, max: number): number | null {
  const n = parseInt(text.trim(), 10);
  if (Number.isNaN(n) || n < min || n > max) return null;
  return n;
}

export const FALLBACK = (): string =>
  `Sorry, we couldn't process your response.\n\n` +
  `Please reply with the number that matches your selection.\n` +
  `For example: 1 or 2.\n\n` +
  `Need assistance?\n` +
  `- MENU: Return to the main menu\n` +
  `- HELP: Contact our support team`;

export const HELP_MESSAGE = (): string =>
  `Thank you for contacting OX Support.\n\n` +
  `A member of our team will assist you as soon as possible.\n\n` +
  `Support Hours:\n` +
  `9:00 AM to 10:00 PM (Daily)\n\n` +
  `For urgent assistance, please call:\n` +
  `0800-OX-HELP`;



  export function getExpiryFooter(expiresAt: string | Date): string {
  const expiry =
    expiresAt instanceof Date ? expiresAt : new Date(expiresAt);

  const remainingMs = expiry.getTime() - Date.now();

  if (remainingMs <= 0) {
    return "Expired";
  }

  const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));

  return `Expires in ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}`;
}

export function getEventCheckoutCta(
  checkoutLink: string,
  eventIsPaid: boolean,
  expiresAt: string | Date
): CtaUrlPayload {
  return {
    bodyText: eventIsPaid
      ? "Still waiting for your checkout to be completed.\n\nReply HELP if you're having trouble, or PAUSE to set this order aside."
      : "Still waiting for your registration to be completed.\n\nReply HELP if you're having trouble, or PAUSE to set this registration aside.",

    footerText: getExpiryFooter(expiresAt),

    buttonText: eventIsPaid
      ? "Complete Checkout"
      : "Complete Registration",

    url: checkoutLink,
  };
}

export function getEventCheckoutStartCta(
  checkoutLink: string,
  eventIsPaid: boolean,
  qty: number,
  tierLabel: string,
  eventName: string,
  expiresAt: Date
): CtaUrlPayload {
  return {
    bodyText:
      `${qty} ticket${qty > 1 ? "s" : ""} of ${tierLabel} for ${eventName}.\n\n` +
      (
        eventIsPaid
          ? "Tap the button below to enter each guest's name and email, then pay securely.\n\nOnce payment is confirmed, your tickets will arrive right here in this chat automatically."
          : "Tap the button below to enter each guest's name and email to complete your registration.\n\nOnce your registration is complete, your tickets will arrive right here in this chat automatically."
      ),

    footerText: getExpiryFooter(expiresAt),

    buttonText: eventIsPaid
      ? "Complete Checkout"
      : "Complete Registration",

    url: checkoutLink,
  };
}