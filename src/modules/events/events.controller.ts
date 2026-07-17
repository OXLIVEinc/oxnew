/**
 * server/modules/events/events.controller.ts
 * -------------------------------------------------------------------------
 * Thin HTTP layer over events.service.
 * -------------------------------------------------------------------------
 */
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as eventsService from "./events.service";

// server/routes/events.ts (or wherever listEvents is)
export const listEvents = asyncHandler(async (req: Request, res: Response) => {
  const { q, genre, ageGroup, page = "1", limit = "20" } = req.query as Record<string, string>;

  const result = await eventsService.listPublicEvents({
    q,
    genre,
    ageGroup,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res.json(result);
});
export const getEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventsService.getEventDetail(req.params.id);
  res.json({ event });
});

export const listMyOrganizerEvents = asyncHandler(async (req: Request, res: Response) => {
  const events = await eventsService.listOrganizerEvents(req.auth!.profileId);
  res.json({ events });
});

export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const result = await eventsService.createEvent(req.auth!.profileId, req.body);
  res.status(201).json(result);
});

export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await eventsService.updateEvent(req.params.id, req.auth!.profileId, req.body);
  res.json({ event });
});

export const toggleLike = asyncHandler(async (req: Request, res: Response) => {
  const result = await eventsService.toggleLike(req.params.id, req.auth!.profileId);
  res.json(result);
});

export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  await eventsService.deleteEvent(req.params.id, req.auth!.profileId);
  res.status(204).send();
});