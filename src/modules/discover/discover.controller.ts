/**
 * server/modules/discover/discover.controller.ts
 * -------------------------------------------------------------------------
 */
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as discoverService from "./discover.service";

export const getFeed = asyncHandler(async (_req: Request, res: Response) => {
  const feed = await discoverService.getDiscoverFeed();
  res.json(feed);
});

export const getFeatured = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ events: await discoverService.getFeatured() });
});

export const getTrending = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ events: await discoverService.getTrending() });
});

export const getThisWeek = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ events: await discoverService.getThisWeek() });
});

export const getDaily = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ events: await discoverService.getDaily() });
});
