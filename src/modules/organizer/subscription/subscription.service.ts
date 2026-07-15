// src/modules/organizer/subscription/subscription.service.ts
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/config/database";
import { organizerSubscriptions } from "@shared/schema";

export async function getSubscription(profileId: string) {
  const [row] = await db
    .select()
    .from(organizerSubscriptions)
    .where(and(eq(organizerSubscriptions.userId, profileId), eq(organizerSubscriptions.status, "active")))
    .orderBy(desc(organizerSubscriptions.createdAt))
    .limit(1);

  return row ?? { plan: "on_demand", status: "active", billingCycle: "monthly", currentPeriodEnd: null };
}

export async function switchToFree(profileId: string) {
  const [existing] = await db
    .select()
    .from(organizerSubscriptions)
    .where(and(eq(organizerSubscriptions.userId, profileId), eq(organizerSubscriptions.status, "active")))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(organizerSubscriptions)
      .set({ plan: "on_demand", amount: "0", updatedAt: new Date() })
      .where(eq(organizerSubscriptions.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(organizerSubscriptions)
    .values({ userId: profileId, plan: "on_demand", status: "active", amount: "0" })
    .returning();
  return created;
}