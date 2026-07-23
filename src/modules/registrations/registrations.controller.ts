import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as registrationsService from "./registrations.service";

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await registrationsService.createEventOrder(
    req.auth!.profileId,
    req.body
  );
  res.status(201).json({ order });
});


export const createGuestOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await registrationsService.createGuestEventOrder(req.body);

  res.status(201).json({ order });
});