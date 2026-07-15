// src/modules/organizer/subscription/subscription.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as service from "./subscription.service";

export const getSubscription = asyncHandler(async (req: Request, res: Response) => {
  const subscription = await service.getSubscription(req.auth!.profileId);
  res.json({ subscription });
});

export const switchToFree = asyncHandler(async (req: Request, res: Response) => {
  const subscription = await service.switchToFree(req.auth!.profileId);
  res.json({ subscription });
});