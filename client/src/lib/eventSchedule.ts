/**
 * src/lib/eventSchedule.ts
 * -------------------------------------------------------------------------
 * Turns the `schedule` object the API returns (date/time/endDate/endTime)
 * into the strings shown in the UI. This is the ONE place that formats an
 * event's date/time — event cards, the detail page, the dashboard, and
 * Discover should all import from here instead of formatting dates inline.
 * -------------------------------------------------------------------------
 */
import type { EventSchedule } from "@/lib/api/types";

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time: string): string {
  const [hoursStr, minutesStr] = time.split(":");
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr ?? "0");
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

export interface FormattedSchedule {
  /** e.g. "Fri, Aug 14, 2026" */
  dateLabel: string;
  /** e.g. "3:00 PM" */
  timeLabel: string;
  /** Only set when the organizer provided an end date/time. */
  endDateLabel: string | null;
  endTimeLabel: string | null;
  /** e.g. "Fri, Aug 14, 2026 · 3:00 PM" — the common single-line display. */
  shortLabel: string;
  /** Adds the end date/time when present, e.g. "... - Sat, Aug 15, 2026 · 1:00 AM" */
  fullLabel: string;
  isMultiDay: boolean;
  isUpcoming: boolean;
}

export function formatEventSchedule(schedule: EventSchedule): FormattedSchedule {
  const dateLabel = formatDate(schedule.date);
  const timeLabel = formatTime(schedule.time);
  const endDateLabel = schedule.endDate ? formatDate(schedule.endDate) : null;
  const endTimeLabel = schedule.endTime ? formatTime(schedule.endTime) : null;
  const isMultiDay = Boolean(schedule.endDate && schedule.endDate !== schedule.date);

  const shortLabel = `${dateLabel} · ${timeLabel}`;

  let fullLabel = shortLabel;
  if (endDateLabel && isMultiDay) {
    fullLabel = `${shortLabel} - ${endDateLabel}${endTimeLabel ? ` · ${endTimeLabel}` : ""}`;
  } else if (endTimeLabel) {
    fullLabel = `${shortLabel} - ${endTimeLabel}`;
  }

  return {
    dateLabel,
    timeLabel,
    endDateLabel,
    endTimeLabel,
    shortLabel,
    fullLabel,
    isMultiDay,
    isUpcoming: schedule.isUpcoming,
  };
}
