import { Request, Response } from 'express';
import * as db from '../data/db';
import { completeTicketOrderPayment } from '../bot/payments';

export const getCheckout = async (req: Request, res: Response) => {
  const order = await db.getTicketOrderById(req.params.orderId);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const event = await db.getEventById(order.eventId);
  res.json({ order, event });
};

export const submitCheckout = async (req: Request, res: Response) => {
  try {
    const items = req.body?.items;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items must be an array of { attendeeName, attendeeEmail }' });
    }

    const order = await db.getTicketOrderById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Free event
    if (Number(order.amount) === 0) {
      await db.submitOrderItemsFree(order.id, items);
      await completeTicketOrderPayment(order.reference, 0);
      return res.json({ 
        ok: true, 
        free: true, 
        authorizationUrl: null, 
        reference: order.reference 
      });
    }

    const updated = await db.submitOrderItems(order.id, items);
    res.json({ 
      ok: true, 
      free: false, 
      authorizationUrl: updated.authorizationUrl, 
      reference: updated.reference 
    });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};