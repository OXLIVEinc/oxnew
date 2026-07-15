// src/modules/organizer/campaigns/campaigns.controller.ts
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as service from "./campaigns.service";

export const listCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const campaigns = await service.listCampaigns(req.auth!.profileId, req.params.eventId);
  res.json({ campaigns });
});

export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
  const campaign = await service.createCampaign(req.auth!.profileId, req.params.eventId, req.body);
  res.status(201).json({ campaign });
});