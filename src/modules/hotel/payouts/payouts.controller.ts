/**
 * server/modules/hotel/payouts/payouts.controller.ts
 * -------------------------------------------------------------------------
 */
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as service from "./payouts.service";

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await service.getPayoutSummary(req.auth!.profileId);
  res.json(summary);
});
