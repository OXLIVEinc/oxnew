import React from "react";
import { resend } from "../lib/resend";
import { TicketOrderEmail } from "../emails/ticketOrderEmail";
import * as db from "../data/db";

export async function sendTicketOrderEmail(orderId: string) {
  const order = await db.getTicketOrderWithDetails(orderId);

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const recipient =
    order.guestEmail ??
    order.user?.email ??
    order.items?.[0]?.attendeeEmail;

  if (!recipient) {
    console.warn(`No email found for order ${order.id}`);
    return;
  }

  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: recipient,
    subject: `Your tickets for ${order.event.title}`,
    react: React.createElement(TicketOrderEmail, {
      order,
    }),
  });
}