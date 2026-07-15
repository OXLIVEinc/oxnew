// src/modules/organizer/campaigns/campaigns.service.ts
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/config/database";
import { campaigns, events, eventRegistrations } from "@shared/schema";
import { AppError } from "@/middleware/error.middleware";

async function assertOwnsEvent(eventId: string, profileId: string) {
  const [event] = await db.select().from(events).where(and(eq(events.id, eventId), eq(events.createdBy, profileId))).limit(1);
  if (!event) throw AppError.forbidden("You do not own this event");
  return event;
}

export async function listCampaigns(profileId: string, eventId: string) {
  await assertOwnsEvent(eventId, profileId);
  return db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.eventId, eventId), eq(campaigns.createdBy, profileId)))
    .orderBy(desc(campaigns.createdAt));
}

export async function createCampaign(
  profileId: string,
  eventId: string,
  input: { subject: string; message: string; type: "email" | "sms" }
) {
  await assertOwnsEvent(eventId, profileId);

  if (!input.subject?.trim() || !input.message?.trim()) {
    throw new AppError("Subject and message are required", 422, "VALIDATION_ERROR");
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eventRegistrations)
    .where(eq(eventRegistrations.eventId, eventId));

  const [row] = await db
    .insert(campaigns)
    .values({
      eventId,
      createdBy: profileId,
      subject: input.subject.trim(),
      message: input.message.trim(),
      type: input.type,
      status: "sent",
      sentAt: new Date(),
      recipientCount: count,
    })
    .returning();

  return row;
}