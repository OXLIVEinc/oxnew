// src/modules/organizer/profile/profile.service.ts
import { eq } from "drizzle-orm";
import { db } from "@/config/database";
import { organizerProfiles } from "@shared/schema";

export interface ProfilePatch {
  brandName?: string;
  bio?: string | null;
  profilePhotoUrl?: string | null;
  website?: string | null;
  instagram?: string | null;
  twitter?: string | null;
}

export async function getProfile(profileId: string) {
  const [row] = await db.select().from(organizerProfiles).where(eq(organizerProfiles.userId, profileId)).limit(1);
  return row ?? null;
}

export async function upsertProfile(profileId: string, patch: ProfilePatch) {
  const existing = await getProfile(profileId);

  if (existing) {
    const [updated] = await db
      .update(organizerProfiles)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(organizerProfiles.id, existing.id))
      .returning();
    return updated;
  }

  // onConflictDoUpdate guards against a race between the getProfile check
  // above and this insert (e.g. two rapid PATCH requests from the same
  // organizer) creating two rows and tripping the unique index on userId.
  const [created] = await db
    .insert(organizerProfiles)
    .values({ userId: profileId, brandName: patch.brandName?.trim() || "Untitled Brand", ...patch })
    .onConflictDoUpdate({
      target: organizerProfiles.userId,
      set: { ...patch, updatedAt: new Date() },
    })
    .returning();
  return created;
}