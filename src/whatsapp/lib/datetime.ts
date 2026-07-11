/**
 * Shared date/time helpers. Two things the rest of the app leans on:
 *
 *  1. Event display: dates are always formatted the same way, and clock
 *     times are always plain 24hr text ("12:00", "20:00" — never AM/PM).
 *  2. Hotel check-in/check-out input: buyers are asked for a friendly
 *     `d/m/yyyy` format (e.g. "7/6/2026"), which we parse strictly so a
 *     typo doesn't silently become the wrong date.
 */

/** "Saturday, 15 March 2026" */
export function formatEventDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Plain 24hr clock time, e.g. "20:00". No AM/PM. */
export function formatClockTime(d: Date | string): string {
  const date = new Date(d);
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** "12:00" or "12:00 to 17:30" if an end time/date is given. */
export function formatEventTimeRange(startsAt: Date | string, endsAt?: Date | string | null): string {
  const start = formatClockTime(startsAt);
  if (!endsAt) return start;
  return `${start} to ${formatClockTime(endsAt)}`;
}

/** "Saturday, 15 March 2026 - 20:00" — used on event cards & confirmations. */
export function formatEventDateTime(startsAt: Date | string, endsAt?: Date | string | null): string {
  return `${formatEventDate(startsAt)} - ${formatEventTimeRange(startsAt, endsAt)}`;
}

/** General display date, e.g. for hotel check-in/out: "15 Mar 2026" */
export function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export interface ParsedDate {
  date: Date;
}

const DATE_FORMAT_HINT = "d/m/yyyy — for example 7/6/2026";

/**
 * Strictly parses "d/m/yyyy" (e.g. "7/6/2026" = 7 June 2026). Returns null
 * (rather than throwing) on anything that doesn't match, so callers can
 * show a friendly re-prompt instead of a stack trace.
 */
export function parseFriendlyDate(text: string): Date | null {
  const trimmed = text.trim();
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Construct in UTC at noon to sidestep timezone edge cases entirely.
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null; // e.g. 31/4/2026 rolled over to May — reject it
  }
  return date;
}

export function friendlyDateFormatHint(): string {
  return DATE_FORMAT_HINT;
}
