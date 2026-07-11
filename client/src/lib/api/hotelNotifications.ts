/**
 * src/lib/api/hotelNotifications.ts
 * -------------------------------------------------------------------------
 */
import { api } from "./http";
import type { NotificationsResult } from "./hotelTypes";

export async function fetchNotifications(page = 1): Promise<NotificationsResult> {
  const { data } = await api.get<NotificationsResult>("/hotel/notifications", { params: { page } });
  return data;
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(`/hotel/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/hotel/notifications/read-all");
}
