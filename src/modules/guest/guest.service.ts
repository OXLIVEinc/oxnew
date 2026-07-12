import { eq, desc } from "drizzle-orm";
import { db } from "@/config/database";
import { eventRegistrations, events, tickets, ticketTiers } from "@shared/schema";
import { toEventSchedule } from "@/modules/events/events.repository";

export type RegisteredEventsFilter = "upcoming" | "past" | "all";

export async function listMyRegisteredEvents(profileId: string, filter: RegisteredEventsFilter = "all") {
  const registrations = await db
    .select({
      registeredAt: eventRegistrations.registeredAt,
      event: events,
    })
    .from(eventRegistrations)
    .innerJoin(events, eq(eventRegistrations.eventId, events.id))
    .where(eq(eventRegistrations.userId, profileId));

  const now = Date.now();

  const withSchedule = registrations.map((r) => {
    const schedule = toEventSchedule(r.event);
    return {
      id: r.event.id,
      title: r.event.title,
      backgroundImageUrl: r.event.backgroundImageUrl,
      address: r.event.address,
      status: r.event.status,
      schedule,
      isPast: new Date(r.event.startsAt).getTime() < now,
      registeredAt: r.registeredAt,
    };
  });

  const filtered =
    filter === "upcoming"
      ? withSchedule.filter((e) => !e.isPast)
      : filter === "past"
      ? withSchedule.filter((e) => e.isPast)
      : withSchedule;

  return filtered.sort((a, b) => {
    // Upcoming events soonest-first; past events most-recent-first.
    const aTime = new Date(a.schedule.date).getTime();
    const bTime = new Date(b.schedule.date).getTime();
    if (!a.isPast && !b.isPast) return aTime - bTime;
    if (a.isPast && b.isPast) return bTime - aTime;
    return a.isPast ? 1 : -1;
  });
}

export async function listMyTickets(profileId: string) {
  const rows = await db
    .select({
      ticket: tickets,
      event: events,
      tier: ticketTiers,
    })
    .from(tickets)
    .innerJoin(events, eq(tickets.eventId, events.id))
    .innerJoin(ticketTiers, eq(tickets.tierId, ticketTiers.id))
    .where(eq(tickets.userId, profileId))
    .orderBy(desc(tickets.createdAt));

  return rows.map(({ ticket, event, tier }) => ({
    id: ticket.id,
    status: ticket.status,
    checkedIn: ticket.checkedIn,
    checkedInAt: ticket.checkedInAt,
    checkInCode: ticket.checkInCode,
    // Public URL of the rendered ticket card (QR baked in) — render this
    // directly as an <img>, do not regenerate a QR client-side.
    qrCode: ticket.qrCode,
    attendeeName: ticket.attendeeName,
    attendeeEmail: ticket.attendeeEmail,
    tierName: tier.name,
    event: {
      id: event.id,
      title: event.title,
      address: event.address,
      schedule: toEventSchedule(event),
    },
  }));
}
