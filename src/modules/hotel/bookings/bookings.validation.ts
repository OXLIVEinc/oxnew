/**
 * server/modules/hotel/bookings/bookings.validation.ts
 * -------------------------------------------------------------------------
 * Input validation for the bookings endpoints. Thrown ZodErrors are turned
 * into a 422 response by the global error handler.
 * -------------------------------------------------------------------------
 */
import { z } from "zod";
import { BOOKING_TABS } from "./bookings.types";

export const listBookingsQuerySchema = z.object({
  tab: z.enum(BOOKING_TABS as [string, ...string[]]).optional(),
  status: z.string().optional(),
  roomTypeId: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(["createdAt", "checkIn", "checkOut", "amount"]).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});
