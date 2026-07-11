import { eq } from "drizzle-orm";

import { db } from "@/config/database";
import { tickets } from "@shared/schema";

import { verifyQrPayload } from "./verify-qr";


export async function validateTicketQr(token: string) {
  //
  // Verify JWT signature
  //
  const payload = verifyQrPayload(token);

  //
  // Load ticket
  //
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, payload.ticketId))
    .limit(1);

  if (!ticket) {
    throw new Error("TICKET_NOT_FOUND");
  }

  //
  // Was this QR invalidated by a transfer?
  //
  if (ticket.checkInCode !== payload.checkInCode) {
    throw new Error("INVALID_QR");
  }

  //
  // Already used?
  //
  if (ticket.checkedIn) {
    throw new Error("TICKET_ALREADY_USED");
  }

  return {
    ticket,
    payload,
  };
}