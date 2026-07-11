import * as db from "../data/db";
import { sendMessage } from "../bot/messenger";

const OX_WHATSAPP_NUMBER = process.env.OX_WHATSAPP_NUMBER || "2348100000000";

/**
 * Step 7 — Referral & Distribution (1hr post-purchase). Gives the buyer a
 * personal wa.me share link for the event they just bought into.
 */
export async function handleReferralUpsell(orderId: string): Promise<void> {
  const order = await db.getTicketOrderById(orderId);
  if (!order) throw new Error(`ORDER_NOT_FOUND: ${orderId}`);
  if (order.status !== "paid") return;
  if (order.referralPushSentAt) return;

  const event = await db.getEventById(order.eventId);
  if (!event) throw new Error(`EVENT_NOT_FOUND: ${order.eventId}`);

  const profile = await db.getOrCreateProfile(order.phone);
  const firstName = profile.displayName?.split(" ")[0] || "there";
  const referralLink = `wa.me/${OX_WHATSAPP_NUMBER}?text=${encodeURIComponent(event.eventCode)}`;

  await sendMessage(
    order.phone,
    `Hi ${firstName}, your tickets are locked in for ${event.title}.\n\n` +
      `Want to bring friends? Send them this link:\n${referralLink}\n\n` +
      `Every friend who buys earns you +100 OX Points.`
  );

  await db.markReferralPushSent(order.id);
}
