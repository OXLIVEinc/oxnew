/**
 * server/modules/hotel/bookings/bookings.types.ts
 * -------------------------------------------------------------------------
 * hotel_orders has more granular statuses than the dashboard needs to show
 * as separate tabs (e.g. "pending" and "awaiting_payment" are both just
 * "not paid yet" from the hotel's point of view). TAB_STATUS_MAP is the one
 * place that mapping lives.
 * -------------------------------------------------------------------------
 */
export type BookingTab =
  | "pending"
  | "paid_awaiting_confirmation"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "declined"
  | "expired";

export const BOOKING_TABS: BookingTab[] = [
  "pending",
  "paid_awaiting_confirmation",
  "confirmed",
  "completed",
  "cancelled",
  "declined",
  "expired",
];

export const TAB_STATUS_MAP: Record<BookingTab, string[]> = {
  pending: ["pending", "awaiting_payment"],
  paid_awaiting_confirmation: ["paid"],
  confirmed: ["confirmed"],
  completed: ["completed"],
  cancelled: ["cancelled"],
  declined: ["declined"],
  expired: ["expired"],
};

export type BookingAction = "confirm" | "decline" | "check_in" | "complete";

export interface BookingListParams {
  tab?: BookingTab;
  status?: string;
  roomTypeId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "checkIn" | "checkOut" | "amount";
  sortDir?: "asc" | "desc";
}
