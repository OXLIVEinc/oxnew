/**
 * server/modules/tickets/tickets.service.ts
 * -------------------------------------------------------------------------
 * Organizer-facing check-in flow. Scans the QR (a signed JWT token), then
 * marks the ticket as checked in — reusing the exact same validation used
 * to generate the ticket, so a check-in can never accept a forged QR.
 * -------------------------------------------------------------------------
 */
import { eq } from "drizzle-orm";
import { db } from "@/config/database";
import { events, tickets } from "@shared/schema";
import { AppError } from "@/middleware/error.middleware";
import { validateTicketQr } from "@/lib/qr/validate-ticket-qr";

export async function checkInTicket(qrToken: string, organizerProfileId: string) {
  let ticket;
  try {
    ({ ticket } = await validateTicketQr(qrToken));
  } catch (err) {
    const message = (err as Error).message;
    if (message === "TICKET_NOT_FOUND") throw AppError.notFound("Ticket not found");
    if (message === "INVALID_QR") throw new AppError("This QR code is no longer valid", 409, "INVALID_QR");
    if (message === "TICKET_ALREADY_USED") {
      throw new AppError("This ticket has already been checked in", 409, "TICKET_ALREADY_USED");
    }
    throw err;
  }

  const [event] = await db.select().from(events).where(eq(events.id, ticket.eventId)).limit(1);
  if (!event) throw AppError.notFound("Event not found");
  if (event.createdBy !== organizerProfileId) {
    throw AppError.forbidden("This ticket belongs to an event you do not own");
  }

  const [updated] = await db
    .update(tickets)
    .set({ checkedIn: true, checkedInAt: new Date(), status: "used" })
    .where(eq(tickets.id, ticket.id))
    .returning();

  return updated;
}
