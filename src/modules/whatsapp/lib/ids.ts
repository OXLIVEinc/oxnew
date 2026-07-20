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

export function generateEventCode(slug: string, year = new Date().getFullYear()): string {
  const cleanSlug = slug
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const shortCode = nanoid(6).toUpperCase();

  return `OX-${cleanSlug}-${year}-${shortCode}`;
}


export { generateReference } from "@/utils/helpers";

export function nextTransferCode(): string {
  return nanoid(10).toUpperCase();
}
