import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as guestService from "./guest.service";

export const listMyEvents = asyncHandler(async (req: Request, res: Response) => {
  const filter = (req.query.filter as guestService.RegisteredEventsFilter) ?? "all";
  const events = await guestService.listMyRegisteredEvents(req.auth!.profileId, filter);
  res.json({ events });
});

export const listMyTickets = asyncHandler(async (req: Request, res: Response) => {
  const tickets = await guestService.listMyTickets(req.auth!.profileId);
  res.json({ tickets });
});
