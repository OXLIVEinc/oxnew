/**
 * server/modules/hotel/bookings/bookings.controller.ts
 * -------------------------------------------------------------------------
 * Thin HTTP layer over bookings.service.
 * -------------------------------------------------------------------------
 */
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as bookingsService from "./bookings.service";
import { listBookingsQuerySchema } from "./bookings.validation";

export const listBookings = asyncHandler(async (req: Request, res: Response) => {
  const params = listBookingsQuerySchema.parse(req.query);
  const result = await bookingsService.listBookings(req.auth!.profileId, params);
  res.json(result);
});

export const getBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingsService.getBookingDetail(req.auth!.profileId, req.params.id);
  res.json({ booking });
});

export const confirmBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingsService.confirmBooking(req.auth!.profileId, req.params.id);
  res.json({ booking });
});

export const declineBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingsService.declineBooking(req.auth!.profileId, req.params.id);
  res.json({ booking });
});

export const markCheckedIn = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingsService.markCheckedIn(req.auth!.profileId, req.params.id);
  res.json({ booking });
});

export const markCompleted = asyncHandler(async (req: Request, res: Response) => {
  const booking = await bookingsService.markCompleted(req.auth!.profileId, req.params.id);
  res.json({ booking });
});
