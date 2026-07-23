// src/modules/organizer/guests/guests.service.ts
import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { db } from "@/config/database";
import { events, eventRegistrations, profiles, tickets, ticketTiers } from "@shared/schema";
import { AppError } from "@/middleware/error.middleware";

async function assertOwnsEvent(eventId: string, profileId: string) {
  const [event] = await db.select().from(events).where(and(eq(events.id, eventId), eq(events.createdBy, profileId))).limit(1);
  if (!event) throw AppError.forbidden("You do not own this event");
}

export async function listGuests(
  profileId: string,
  eventId: string,
  params: { dateFrom?: string; dateTo?: string }
) {
  await assertOwnsEvent(eventId, profileId);

  const conditions = [eq(eventRegistrations.eventId, eventId)];
  if (params.dateFrom) conditions.push(gte(eventRegistrations.registeredAt, new Date(params.dateFrom)));
  if (params.dateTo) conditions.push(lte(eventRegistrations.registeredAt, new Date(`${params.dateTo}T23:59:59`)));

  const regs = await db.select().from(eventRegistrations).where(and(...conditions));
  if (regs.length === 0) return [];

 const userIds = regs.flatMap((r) => (r.userId ? [r.userId] : []));

  const [profileRows, ticketRows, tierRows] = await Promise.all([
    db.select().from(profiles).where(inArray(profiles.id, userIds)),
    db.select().from(tickets).where(and(eq(tickets.eventId, eventId), inArray(tickets.userId, userIds))),
    db.select().from(ticketTiers).where(eq(ticketTiers.eventId, eventId)),
  ]);

  const profileMap = new Map(profileRows.map((p) => [p.id, p]));
  const tierMap = new Map(tierRows.map((t) => [t.id, t.name]));

  const guestList: any[] = [];

  ticketRows.forEach((t) => {
    if (!t.userId) {
  return; // or continue in a for...of loop
}
    const profile = profileMap.get(t.userId);
    const reg = regs.find((r) => r.userId === t.userId);
    guestList.push({
      userId: t.userId,
      registeredAt: reg?.registeredAt ?? null,
      displayName: t.attendeeName || profile?.displayName || null,
      email: t.attendeeEmail || profile?.email || null,
      phone: t.attendeePhone || profile?.phone || null,
      gender: profile?.gender ?? null,
      locationCountry: profile?.locationCountry ?? null,
      checkedIn: t.checkedIn,
      tierName: t.tierId ? tierMap.get(t.tierId) ?? null : null,
      checkInCode: t.checkInCode,
      ticketId: t.id,
    });
  });

  regs.forEach((r) => {
    if (!r.userId) {
  return; // or continue in a for...of loop
}
    if (!ticketRows.some((t) => t.userId === r.userId)) {
      const profile = profileMap.get(r.userId);
      guestList.push({
        userId: r.userId,
        registeredAt: r.registeredAt,
        displayName: profile?.displayName ?? null,
        email: profile?.email ?? null,
        phone: profile?.phone ?? null,
        gender: profile?.gender ?? null,
        locationCountry: profile?.locationCountry ?? null,
        checkedIn: false,
        tierName: null,
        checkInCode: null,
        ticketId: null,
      });
    }
  });

  return guestList;
}

export async function removeGuest(profileId: string, eventId: string, userId: string) {
  await assertOwnsEvent(eventId, profileId);
  await db.delete(eventRegistrations).where(and(eq(eventRegistrations.eventId, eventId), eq(eventRegistrations.userId, userId)));
  await db.delete(tickets).where(and(eq(tickets.eventId, eventId), eq(tickets.userId, userId)));
  return { ok: true };
}