import { eq } from "drizzle-orm";
import { db } from "@/config/database";
import { events, tickets } from "@shared/schema";
import { AppError } from "@/middleware/error.middleware";
import { validateTicketQr } from "@/lib/qr/validate-ticket-qr";

async function assertOwnedByOrganizer(eventId: string, organizerProfileId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw AppError.notFound("Event not found");
  if (event.createdBy !== organizerProfileId) {
    throw AppError.forbidden("This ticket belongs to an event you do not own");
  }
}

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

  await assertOwnedByOrganizer(ticket.eventId, organizerProfileId);

  const [updated] = await db
    .update(tickets)
    .set({ checkedIn: true, checkedInAt: new Date(), status: "used" })
    .where(eq(tickets.id, ticket.id))
    .returning();

  return updated;
}

/** Manual entry fallback — checks in by the human-typeable check-in code instead of scanning the JWT QR. */
export async function checkInByCode(code: string, organizerProfileId: string) {
  const normalized = code.trim().toUpperCase();

  const [ticket] = await db.select().from(tickets).where(eq(tickets.checkInCode, normalized)).limit(1);
  if (!ticket) throw AppError.notFound("Ticket not found for that code");

  await assertOwnedByOrganizer(ticket.eventId, organizerProfileId);

  if (ticket.status === "transferred") {
    throw new AppError("This ticket has been transferred and is no longer valid", 409, "TICKET_TRANSFERRED");
  }
  if (ticket.checkedIn) {
    throw new AppError("This ticket has already been checked in", 409, "TICKET_ALREADY_USED");
  }

  const [updated] = await db
    .update(tickets)
    .set({ checkedIn: true, checkedInAt: new Date(), status: "used" })
    .where(eq(tickets.id, ticket.id))
    .returning();

  return updated;
}