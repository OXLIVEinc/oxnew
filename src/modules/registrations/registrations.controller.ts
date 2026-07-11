/**
 * server/modules/registrations/registrations.controller.ts
 * -------------------------------------------------------------------------
 */
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as registrationsService from "./registrations.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await registrationsService.registerForEvent(req.auth!.profileId, req.body);
  res.status(result.requiresPayment ? 202 : 201).json(result);
});
