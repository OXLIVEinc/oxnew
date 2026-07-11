/**
 * server/modules/hotel/notifications/notifications.service.ts
 * -------------------------------------------------------------------------
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/config/database";
import { notifications } from "@shared/schema";
import { AppError } from "@/middleware/error.middleware";

export async function listNotifications(profileId: string, page = 1, pageSize = 20) {
  const [rows, [{ unread }], [{ total }]] = await Promise.all([
    db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, profileId))
      .orderBy(desc(notifications.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db
      .select({ unread: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, profileId), eq(notifications.read, false))),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(notifications)
      .where(eq(notifications.userId, profileId)),
  ]);

  return { notifications: rows, unreadCount: unread, total, page, pageSize };
}

export async function markRead(profileId: string, notificationId: string) {
  const [updated] = await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, profileId)))
    .returning();
  if (!updated) throw AppError.notFound("Notification not found");
  return updated;
}

export async function markAllRead(profileId: string) {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, profileId), eq(notifications.read, false)));
  return { success: true };
}
