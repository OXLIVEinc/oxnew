/**
 * server/modules/tickets/tickets.controller.ts
 * -------------------------------------------------------------------------
 */
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as ticketsService from "./tickets.service";

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await ticketsService.checkInTicket(req.body.token, req.auth!.profileId);
  res.json({ ticket });
});
