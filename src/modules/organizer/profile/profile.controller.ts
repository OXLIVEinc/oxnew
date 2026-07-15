// src/modules/organizer/profile/profile.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as service from "./profile.service";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await service.getProfile(req.auth!.profileId);
  res.json({ profile });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await service.upsertProfile(req.auth!.profileId, req.body);
  res.json({ profile });
});