// src/modules/organizer/dashboard/dashboard.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as service from "./dashboard.service";

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const overview = await service.getOverview(req.auth!.profileId);
  res.json({ overview });
});

export const listEvents = asyncHandler(async (req: Request, res: Response) => {
  const events = await service.listOrganizerEventsWithStats(req.auth!.profileId);
  res.json({ events });
});

export const getAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { dateFrom, dateTo } = req.query as Record<string, string | undefined>;
  const analytics = await service.getEventAnalytics(req.auth!.profileId, req.params.eventId, dateFrom, dateTo);
  res.json(analytics);
});