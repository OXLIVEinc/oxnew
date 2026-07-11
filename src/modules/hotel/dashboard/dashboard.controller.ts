/**
 * server/modules/hotel/dashboard/dashboard.controller.ts
 * -------------------------------------------------------------------------
 */
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as service from "./dashboard.service";

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const overview = await service.getOverview(req.auth!.profileId);
  res.json({ overview });
});

export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
  const activity = await service.getRecentActivity(req.auth!.profileId);
  res.json(activity);
});

export const getBookingStatusChart = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getBookingStatusChart(req.auth!.profileId);
  res.json({ data });
});

export const getRevenueChart = asyncHandler(async (req: Request, res: Response) => {
  const data = await service.getRevenueChart(req.auth!.profileId);
  res.json({ data });
});
