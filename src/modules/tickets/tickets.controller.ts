import type { Request, Response } from "express";
import { asyncHandler } from "@/middleware/error.middleware";
import * as ticketsService from "./tickets.service";
import * as db from '../../modules/whatsapp/data/db'

export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await ticketsService.checkInTicket(req.body.token, req.auth!.profileId);
  res.json({ ticket });
});

export const checkInByCode = asyncHandler(async (req: Request, res: Response) => {
  const ticket = await ticketsService.checkInByCode(req.body.code, req.auth!.profileId);
  res.json({ ticket });
});

export const getCheckout = async (req: Request, res: Response) => {
  const order = await db.getTicketOrderById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const event = await db.getEventById(order.eventId);
  const ticketTiers = event ? await db.getTiersForEvent(event.id) : [];

  res.json({ order, event: event ? { ...event, ticketTiers } : event });
};