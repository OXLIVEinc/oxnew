/**
 * server/modules/hotel/notifications/notifications.controller.ts
 * -------------------------------------------------------------------------
 */
import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as service from "./notifications.service";

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const page = req.query.page ? Number(req.query.page) : 1;
  const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 20;
  const result = await service.listNotifications(req.auth!.profileId, page, pageSize);
  res.json(result);
});

export const markRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await service.markRead(req.auth!.profileId, req.params.id);
  res.json({ notification });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.markAllRead(req.auth!.profileId);
  res.json(result);
});
