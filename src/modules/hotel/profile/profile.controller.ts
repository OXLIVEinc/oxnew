/**
 * server/modules/hotel/profile/profile.controller.ts
 * -------------------------------------------------------------------------
 */
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as service from "./profile.service";
import { updateHotelProfileSchema } from "./profile.validation";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const hotel = await service.getProfile(req.auth!.profileId);
  res.json({ hotel });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const patch = updateHotelProfileSchema.parse(req.body);
  const hotel = await service.updateProfile(req.auth!.profileId, patch);
  res.json({ hotel });
});
