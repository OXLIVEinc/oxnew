import { Request, Response } from 'express';
import { handleMessage } from '../bot/router';
import { completeTicketOrderPayment,completeHotelOrderPayment } from '../bot/payments';
import { markAsReadAndShowTyping } from '../lib/whatsapp';
import { sendMessage,sendCtaUrlMessage } from '../bot/messenger';

export const whatsappWebhook = {
  get: (req: Request, res: Response) => {
    console.log('hello');
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  },

  post: async (req: Request, res: Response) => {
    try {
      const entries = req.body?.entry || [];

      for (const entry of entries) {
        for (const change of entry.changes || []) {
          const value = change.value || {};
          const messages = value.messages || [];
          const contacts = value.contacts || [];

          for (const message of messages) {
            const phone = message.from;
            const messageId = message.id;
            const text = message.text?.body;
            const waName = contacts.find((c: any) => c.wa_id === phone)?.profile?.name;

            if (!phone || !text || !messageId) continue;

            await markAsReadAndShowTyping(messageId);

            const { reply, followUp, cta } = await handleMessage(phone, text, waName);

            if (reply) await sendMessage(phone, reply); // You'll need to import sendMessage if used directly
            if (cta) await sendCtaUrlMessage(phone, cta);
            if (followUp) {
              setTimeout(() => sendMessage(phone, followUp), 2000);
            }
          }
        }
      }

      res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(200).json({ ok: true });
    }
  }
};

export const paystackWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.body?.event;
    const data = req.body?.data || {};
    const reference = data.reference;
    const amountKobo = typeof data.amount === 'number' ? data.amount : undefined;
    const kind = data.metadata?.kind;

    if (event && event !== 'charge.success') {
      return res.status(200).json({ ok: true, ignored: event });
    }

    if (!reference) {
      return res.status(400).json({ error: 'Missing data.reference' });
    }

    if (kind === 'hotel' || reference.startsWith('OX-HTL')) {
      await completeHotelOrderPayment(reference, amountKobo);
    } else {
      await completeTicketOrderPayment(reference, amountKobo);
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
};