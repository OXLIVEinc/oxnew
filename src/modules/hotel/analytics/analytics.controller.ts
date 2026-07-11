/**
 * server/modules/hotel/analytics/analytics.controller.ts
 * -------------------------------------------------------------------------
 */
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as service from "./analytics.service";

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await service.getAnalyticsSummary(req.auth!.profileId);
  res.json(summary);
});
