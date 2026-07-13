import { Request, Response } from 'express';
import { handleMessage } from '../bot/router';
import { completeTicketOrderPayment, completeHotelOrderPayment } from '../bot/payments';
import { markAsReadAndShowTyping } from '../lib/whatsapp';
import { sendMessage, sendCtaUrlMessage } from '../bot/messenger';
import { normalizeIncomingPhone } from '@/utils/helpers';
import { IncomingMedia } from '../types';


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
            const phone = normalizeIncomingPhone(message.from);
            console.log(phone,message.from)
            const messageId = message.id;


            // Default to a normal text message.
            let text = message.text?.body ?? "";
            let media: IncomingMedia | undefined;

         if (message.type === 'image' && message.image) {
  media = {
    id: message.image.id,
    mimeType: message.image.mime_type,
    filename: `support-${message.image.id}.jpg`,
  };
}

            // Handle reply button presses.
            const buttonId = message.interactive?.button_reply?.id;

            if (buttonId?.startsWith("hotel_confirm:")) {
              text = `CONFIRM ${buttonId.split(":")[1]}`;
            } else if (buttonId?.startsWith("hotel_decline:")) {
              text = `DECLINE ${buttonId.split(":")[1]}`;
            }

            const waName =
              contacts.find((c: any) => normalizeIncomingPhone(c.wa_id) === phone)?.profile?.name;

            if (!phone || !messageId || (!text && !media)) {
  continue;
}

            await markAsReadAndShowTyping(messageId);

            const { reply, followUp, cta } =
    await handleMessage(
        phone,
        text,
        waName,
        media,
    );

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