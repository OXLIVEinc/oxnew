import { eq } from "drizzle-orm";
import { db } from "../../db/client";
import { tickets } from "../../../shared/schema";
import { verifyQrPayload } from "./verify-qr";

/**
 * Door-scan validation: verifies the JWT signature, loads the ticket, and
 * confirms it hasn't been transferred away or already checked in.
 */
export async function validateTicketQr(token: string) {
  const payload = verifyQrPayload(token);

  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, payload.ticketId))
    .limit(1);

  if (!ticket) {
    throw new Error("TICKET_NOT_FOUND");
  }

  if (ticket.checkInCode !== payload.checkInCode) {
    throw new Error("INVALID_QR");
  }

  if (ticket.status === "transferred") {
    throw new Error("TICKET_TRANSFERRED");
  }

  if (ticket.checkedIn) {
    throw new Error("TICKET_ALREADY_USED");
  }

  return { ticket, payload };
}
