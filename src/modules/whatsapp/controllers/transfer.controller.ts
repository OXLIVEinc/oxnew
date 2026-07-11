import { Request, Response } from 'express';
import * as db from '../data/db';

export const getClaim = async (req: Request, res: Response) => {
  const transfer = await db.getTransferByCode(req.params.code);
  if (!transfer) return res.status(404).json({ error: 'Transfer not found' });

  const ticket = await db.getTicketWithDetails(transfer.ticketId);
  res.json({ transfer, ticket });
};

export const confirmClaim = async (req: Request, res: Response) => {
  try {
    const { fullName, email } = req.body || {};
    if (!fullName || !email) {
      return res.status(400).json({ error: 'fullName and email are required' });
    }

    await db.claimTransfer(req.params.code, fullName, email);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};

export const declineClaim = async (req: Request, res: Response) => {
  try {
    await db.declineTransfer(req.params.code);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
};