/**
 * server/modules/hotel/room-types/room-types.controller.ts
 * -------------------------------------------------------------------------
 */
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as service from "./room-types.service";
import { createRoomTypeSchema, updateRoomTypeSchema } from "./room-types.validation";

export const listRoomTypes = asyncHandler(async (req: Request, res: Response) => {
  const roomTypes = await service.listRoomTypes(req.auth!.profileId);
  res.json({ roomTypes });
});

export const createRoomType = asyncHandler(async (req: Request, res: Response) => {
  const input = createRoomTypeSchema.parse(req.body);
  const roomType = await service.createRoomType(req.auth!.profileId, input);
  res.status(201).json({ roomType });
});

export const updateRoomType = asyncHandler(async (req: Request, res: Response) => {
  const input = updateRoomTypeSchema.parse(req.body);
  const roomType = await service.updateRoomType(req.auth!.profileId, req.params.id, input);
  res.json({ roomType });
});

export const deleteRoomType = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.deleteRoomType(req.auth!.profileId, req.params.id);
  res.json(result);
});
