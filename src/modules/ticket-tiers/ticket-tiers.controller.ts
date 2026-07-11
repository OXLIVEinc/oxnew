/**
 * server/modules/ticket-tiers/ticket-tiers.controller.ts
 * -------------------------------------------------------------------------
 * Thin HTTP layer over ticket-tiers.service. All ownership/authorization
 * and business rules live in the service — controllers just translate
 * req/res.
 * -------------------------------------------------------------------------
 */
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as ticketTiersService from "./ticket-tiers.service";

export const listTicketTiers = asyncHandler(async (req: Request, res: Response) => {
  const tiers = await ticketTiersService.listTiersForEvent(req.params.eventId);
  res.json({ tiers });
});

export const addTicketTier = asyncHandler(async (req: Request, res: Response) => {
  const tier = await ticketTiersService.addTierToEvent(req.params.eventId, req.auth!.profileId, req.body);
  res.status(201).json({ tier });
});

export const updateTicketTier = asyncHandler(async (req: Request, res: Response) => {
  const tier = await ticketTiersService.updateTier(
    req.params.eventId,
    req.params.tierId,
    req.auth!.profileId,
    req.body
  );
  res.json({ tier });
});

export const deleteTicketTier = asyncHandler(async (req: Request, res: Response) => {
  await ticketTiersService.deleteTier(req.params.eventId, req.params.tierId, req.auth!.profileId);
  res.status(204).send();
});
