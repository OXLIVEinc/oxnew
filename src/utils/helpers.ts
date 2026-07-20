import crypto from "crypto";
import { nanoid } from "nanoid";
/**
 * Formats an ISO date string for display on the printed ticket card.
 * e.g. "2026-08-14T00:00:00.000Z" -> "Fri, 14 Aug 2026"
 */
export function formatEventDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Generates a short, human-typeable check-in code (used as a fallback when
 * scanning the QR isn't possible, e.g. "7K3F-9QZP").
 */
export function generateCheckInCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += alphabet[bytes[i] % alphabet.length];
    if (i === 3) code += "-";
  }
  return code;
}

/**
 * Generates a short, URL-safe, human-shareable event code
 * (used as the public slug for an event, e.g. in share links).
 */
export function generateEventCode(slug: string, year = new Date().getFullYear()): string {
  const cleanSlug = slug
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const shortCode = nanoid(6).toUpperCase();

  return `OX-${cleanSlug}-${year}-${shortCode}`;
}
/**
 * Generates a unique order/ticket-order reference for Paystack.
 */

//  * Canonical reference generator for every order/booking in the system.
//  * Format: OX-<PREFIX>-<TIMESTAMP36>-<NANOID6>, e.g. "OX-ORD-MRPDINZI-RY8K2X".
//  */
export function generateReference(prefix: "OX-ORD" | "OX-HTL"): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${nanoid(6).toUpperCase()}`;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/^\+/, "").trim();
}

export function normalizeIncomingPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `+${digits}`;
}