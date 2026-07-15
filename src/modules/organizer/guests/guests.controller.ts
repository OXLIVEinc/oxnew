// src/modules/organizer/guests/guests.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as service from "./guests.service";

export const listGuests = asyncHandler(async (req: Request, res: Response) => {
  const { dateFrom, dateTo } = req.query as Record<string, string | undefined>;
  const guests = await service.listGuests(req.auth!.profileId, req.params.eventId, { dateFrom, dateTo });
  res.json({ guests });
});

export const removeGuest = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.removeGuest(req.auth!.profileId, req.params.eventId, req.params.userId);
  res.json(result);
});