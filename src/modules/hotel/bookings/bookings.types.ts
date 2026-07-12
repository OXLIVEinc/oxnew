/**
 * server/modules/hotel/bookings/bookings.types.ts
 * -------------------------------------------------------------------------
 * Types shared across the hotel bookings module.
 * -------------------------------------------------------------------------
 */

import { hotelOrders } from "@shared/schema";

/**
 * Infer the hotel order status directly from the Drizzle schema so it always
 * stays in sync with the database enum.
 */
export type HotelOrderStatus = typeof hotelOrders.$inferSelect.status;

export const HOTEL_ORDER_STATUSES = [
  "pending",
  "awaiting_payment",
  "paid",
  "confirmed",
  "declined",
  "cancelled",
  "expired",
  "completed",
] as const satisfies readonly HotelOrderStatus[];



export const BOOKING_TABS = [
  "pending",
  "paid_awaiting_confirmation",
  "confirmed",
  "completed",
  "cancelled",
  "declined",
  "expired",
] as const;

export type BookingTab = typeof BOOKING_TABS[number];

/**
 * Dashboard tabs map to one or more underlying hotel order statuses.
 */
export const TAB_STATUS_MAP: Record<BookingTab, HotelOrderStatus[]> = {
  pending: ["pending", "awaiting_payment"],
  paid_awaiting_confirmation: ["paid"],
  confirmed: ["confirmed"],
  completed: ["completed"],
  cancelled: ["cancelled"],
  declined: ["declined"],
  expired: ["expired"],
};

export type BookingAction =
  | "confirm"
  | "decline"
  | "check_in"
  | "complete";

export interface BookingListParams {
  /**
   * Dashboard tab filter.
   */
  tab?: BookingTab;

  /**
   * Filter by a specific hotel order status.
   */
  status?: HotelOrderStatus;

  roomTypeId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;

  page?: number;
  pageSize?: number;

  sortBy?: "createdAt" | "checkIn" | "checkOut" | "amount";
  sortDir?: "asc" | "desc";
}