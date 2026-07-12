import crypto from "crypto";

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
export function generateEventCode(): string {
  return crypto.randomBytes(4).toString("hex");
}

/**
 * Generates a unique order/ticket-order reference for Paystack.
 */
export function generateOrderReference(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}


export function normalizePhone(phone: string): string {
  return phone.replace(/^\+/, "").trim();
}

export function normalizeIncomingPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `+${digits}`;
}