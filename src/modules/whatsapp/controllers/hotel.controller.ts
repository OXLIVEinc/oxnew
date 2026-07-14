import { Request, Response } from 'express';
import * as db from '../data/db'
import { completeHotelOrderPayment } from '../bot/payments';

export const getHotelOrder = async (req: Request, res: Response) => {
  const summary = await db.getHotelOrderSummary(req.params.orderId);
  if (!summary) return res.status(404).json({ error: 'Order not found' });
  res.json(summary);
};

export const payHotelOrder = async (req: Request, res: Response) => {
  try {
    const order = await db.getHotelOrderById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (order.status !== 'pending') {
      return res.status(400).json({ error: `This order is already ${order.status}.` });
    }

    // Free booking
    if (Number(order.amount) === 0) {
      await completeHotelOrderPayment(order.reference, 0); 
      const updated = await db.getHotelOrderById(order.id);
      return res.json({ ok: true, free: true, status: updated?.status });
    }

    const { email } = req.body || {};
    const profile = await db.getOrCreateProfile(order.phone);
    const updated = await db.initiateHotelOrderPayment(
      order.id, 
      email || profile.email || `${order.phone}@guest.ox.app`
    );

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