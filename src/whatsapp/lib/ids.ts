import { v4 as uuidv4 } from "uuid";
import { nanoid } from "nanoid";

/**
 * Check-in code stamped on every ticket and shown at the door.
 * Format: OX-XXXXXX (6 uppercase hex chars taken from a real UUID).
 */
export function generateCheckInCode(): string {
  return (
    "OX-" +
    uuidv4()
      .replace(/-/g, "")
      .substring(0, 6)
      .toUpperCase()
  );
}

/**
 * Deep-link / shareable event code.
 * Format: OX-<SLUG>-<YEAR>-<SHORTCODE>, e.g. OX-AFROBEATS-NIGHT-2026-A1B2C3
 */
export function generateEventCode(slug: string, year = new Date().getFullYear()): string {
  const cleanSlug = slug
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const shortCode = nanoid(6).toUpperCase();

  return `OX-${cleanSlug}-${year}-${shortCode}`;
}

export function nextOrderReference(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${nanoid(6).toUpperCase()}`;
}

export function nextHotelReference(): string {
  return `OX-HTL-${Date.now().toString(36).toUpperCase()}-${nanoid(6).toUpperCase()}`;
}

export function nextTransferCode(): string {
  return nanoid(10).toUpperCase();
}
