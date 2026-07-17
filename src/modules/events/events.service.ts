/**
 * server/modules/events/events.service.ts
 * -------------------------------------------------------------------------
 * Business logic for events. Controllers call these; nothing here reads
 * from `req`/`res` directly, which keeps it independently testable.
 * -------------------------------------------------------------------------
 */
import { and, desc, eq, ilike, or,count } from "drizzle-orm";
import { db } from "@/config/database";
import {
  events,
  eventGallery,
  eventLikes,
  venueMaps,
  venueSections,
  type Event,
} from "@shared/schema";
import { AppError } from "@/middleware/error.middleware";
import { generateEventCode } from "@/utils/helpers";
import {
  getEngagementStatsForEvent,
  getEngagementStatsForEvents,
  getTiersForEvents,
  toEventSchedule,
} from "./events.repository";
import {
  normalizeAndValidateTiers,
  insertTiersForEvent,
  type TicketTierInput,
} from "@/modules/ticket-tiers/ticket-tiers.service";
import { isTierSoldOut } from "./events.repository";

export interface CreateEventInput {
  title: string;
  description?: string;
  startsAt: string; // ISO date, required
  startTime: string; // "HH:MM", required
  endsAt?: string | null;
  endTime?: string | null;
  address: string;
  locationLat: number;
  locationLng: number;
  backgroundImageUrl: string;
  mobileBannerUrl?: string | null;
  desktopBannerUrl?: string | null;
  isPaid: boolean;
  ageGroup?: string | null;
  genre?: string | null;
  tags?: string[];
  maxPerOrder?: number;
  status?: "active" | "draft";
  ticketTiers: TicketTierInput[];
  gallery?: { mediaUrl: string; mediaType: string }[];
  venueMap?: {
    imageUrl: string;
    sections: { name: string; color: string; capacity: number; tierIndex?: number | null }[];
  } | null;
}

function serializeEvent(
  event: Event,
  extra: { likeCount: number; registrationCount: number; tiers?: any[] }
) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    schedule: toEventSchedule(event),
    address: event.address,
    locationLat: event.locationLat,
    locationLng: event.locationLng,
    backgroundImageUrl: event.backgroundImageUrl,
    mobileBannerUrl: event.mobileBannerUrl,
    desktopBannerUrl: event.desktopBannerUrl,
    isPaid: event.isPaid,
    ageGroup: event.ageGroup,
    genre: event.genre,
    tags: event.tags ?? [],
    status: event.status,
    approvalStatus: event.approvalStatus,
    isFeatured: event.isFeatured,
    eventCode: event.eventCode,
    createdBy: event.createdBy,
    likeCount: extra.likeCount,
    registrationCount: extra.registrationCount,
    ticketTiers: extra.tiers ?? undefined,
    createdAt: event.createdAt,
  };
}

/** Public event list — only approved + active events, newest first. */
// src/services/events.service.ts (or wherever listPublicEvents is)

export async function listPublicEvents(params: {
  q?: string;
  genre?: string;
  ageGroup?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 20)); // cap at 50
  const offset = (page - 1) * limit;

  const conditions = [
    eq(events.status, "active"),
    eq(events.approvalStatus, "approved"),
  ];

  if (params.genre) conditions.push(eq(events.genre, params.genre));
  if (params.ageGroup) conditions.push(eq(events.ageGroup, params.ageGroup));
  if (params.q) {
    conditions.push(
      or(
        ilike(events.title, `%${params.q}%`),
        ilike(events.address, `%${params.q}%`),
      )!
    );
  }

  const [rows, totalCount] = await Promise.all([
    db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(desc(events.startsAt))
      .limit(limit)
      .offset(offset),

    db
      .select({ count: count() })
      .from(events)
      .where(and(...conditions))
      .then((res) => res[0].count),
  ]);

  const ids = rows.map((r:any) => r.id);
  const stats = await getEngagementStatsForEvents(ids);

  const serialized = rows.map((event:Event) =>
    serializeEvent(event, {
      likeCount: stats[event.id]?.likeCount ?? 0,
      registrationCount: stats[event.id]?.registrationCount ?? 0,
    })
  );

  return {
    events: serialized,
    pagination: {
      page,
      limit,
      total: Number(totalCount),
      totalPages: Math.ceil(Number(totalCount) / limit),
    },
  };
}

/** Full detail for a single event, including its ticket tiers (with derived sold-out flag). */
export async function getEventDetail(eventId: string) {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw AppError.notFound("Event not found");

  const tiersByEvent = await getTiersForEvents([eventId]);
  const tiers = (tiersByEvent[eventId] ?? []).map((t) => ({ ...t, isSoldOut: isTierSoldOut(t) }));

  const stats = await getEngagementStatsForEvent(eventId);

  const gallery = await db.select().from(eventGallery).where(eq(eventGallery.eventId, eventId));

  return {
    ...serializeEvent(event, { ...stats, tiers }),
    gallery,
  };
}

/**
 * Creates an event, its required ticket tiers, and optionally its gallery
 * and venue seating map — all inside a single transaction so a failure
 * partway through never leaves an event without tiers.
 */
export async function createEvent(organizerProfileId: string, input: CreateEventInput) {
  const normalizedTiers = normalizeAndValidateTiers(input.isPaid, input.ticketTiers);

  return db.transaction(async (tx) => {
    const [event] = await tx
      .insert(events)
      .values({
        title: input.title,
        description: input.description ?? null,
        startsAt: new Date(input.startsAt),
        startTime: input.startTime,
        endsAt: input.endsAt ? new Date(input.endsAt) : null,
        endTime: input.endTime ?? null,
        address: input.address,
        locationLat: String(input.locationLat),
        locationLng: String(input.locationLng),
        backgroundImageUrl: input.backgroundImageUrl,
        mobileBannerUrl: input.mobileBannerUrl ?? null,
        desktopBannerUrl: input.desktopBannerUrl ?? null,
        isPaid: input.isPaid,
        ageGroup: input.ageGroup ?? null,
        genre: input.genre ?? null,
        tags: input.tags?.length ? input.tags : null,
        maxPerOrder: input.maxPerOrder ?? 10,
        status: input.status ?? "active",
        eventCode: generateEventCode(input.title),
        createdBy: organizerProfileId,
      })
      .returning();

    const tiers = await insertTiersForEvent(tx, event.id, normalizedTiers);

    if (input.gallery?.length) {
      await tx.insert(eventGallery).values(
        input.gallery.map((item, i) => ({
          eventId: event.id,
          mediaUrl: item.mediaUrl,
          mediaType: item.mediaType,
          sortOrder: i,
        }))
      );
    }

    if (input.venueMap) {
      const [map] = await tx
        .insert(venueMaps)
        .values({ eventId: event.id, imageUrl: input.venueMap.imageUrl })
        .returning();

      if (input.venueMap.sections.length) {
        await tx.insert(venueSections).values(
          input.venueMap.sections.map((section, i) => ({
            eventId: event.id,
            venueMapId: map.id,
            name: section.name,
            color: section.color,
            capacity: section.capacity,
            ticketTierId:
              section.tierIndex !== null && section.tierIndex !== undefined
                ? tiers[section.tierIndex]?.id ?? null
                : null,
            sortOrder: i,
          }))
        );
      }
    }

    return { event: serializeEvent(event, { likeCount: 0, registrationCount: 0 }), ticketTiers: tiers };
  });
}

export async function updateEvent(eventId: string, organizerProfileId: string, patch: Partial<CreateEventInput>) {
  const [existing] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!existing) throw AppError.notFound("Event not found");
  if (existing.createdBy !== organizerProfileId) throw AppError.forbidden("You do not own this event");

  const [updated] = await db
    .update(events)
    .set({
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.startsAt !== undefined && { startsAt: new Date(patch.startsAt) }),
      ...(patch.startTime !== undefined && { startTime: patch.startTime }),
      ...(patch.endsAt !== undefined && { endsAt: patch.endsAt ? new Date(patch.endsAt) : null }),
      ...(patch.endTime !== undefined && { endTime: patch.endTime }),
      ...(patch.address !== undefined && { address: patch.address }),
      ...(patch.locationLat !== undefined && { locationLat: String(patch.locationLat) }),
      ...(patch.locationLng !== undefined && { locationLng: String(patch.locationLng) }),
      ...(patch.backgroundImageUrl !== undefined && { backgroundImageUrl: patch.backgroundImageUrl }),
      ...(patch.mobileBannerUrl !== undefined && { mobileBannerUrl: patch.mobileBannerUrl }),
      ...(patch.desktopBannerUrl !== undefined && { desktopBannerUrl: patch.desktopBannerUrl }),
      ...(patch.isPaid !== undefined && { isPaid: patch.isPaid }),
      ...(patch.ageGroup !== undefined && { ageGroup: patch.ageGroup }),
      ...(patch.genre !== undefined && { genre: patch.genre }),
      ...(patch.tags !== undefined && { tags: patch.tags?.length ? patch.tags : null }),
      ...(patch.status !== undefined && { status: patch.status }),
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId))
    .returning();

  const stats = await getEngagementStatsForEvent(eventId);
  return serializeEvent(updated, stats);
}

export async function listOrganizerEvents(organizerProfileId: string) {
  const rows = await db
    .select()
    .from(events)
    .where(eq(events.createdBy, organizerProfileId))
    .orderBy(desc(events.createdAt));

  const ids = rows.map((r) => r.id);
  const stats = await getEngagementStatsForEvents(ids);
  return rows.map((event) => serializeEvent(event, stats[event.id] ?? { likeCount: 0, registrationCount: 0 }));
}

/** Toggles the current guest's like on an event. Returns the new liked state + count. */
export async function toggleLike(eventId: string, profileId: string) {
  const [existing] = await db
    .select()
    .from(eventLikes)
    .where(and(eq(eventLikes.eventId, eventId), eq(eventLikes.userId, profileId)))
    .limit(1);

  if (existing) {
    await db.delete(eventLikes).where(eq(eventLikes.id, existing.id));
  } else {
    await db.insert(eventLikes).values({ eventId, userId: profileId });
  }

  const stats = await getEngagementStatsForEvent(eventId);
  return { liked: !existing, likeCount: stats.likeCount };
}


export async function deleteEvent(eventId: string, organizerProfileId: string) {
  const [existing] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!existing) throw AppError.notFound("Event not found");
  if (existing.createdBy !== organizerProfileId) {
    throw AppError.forbidden("You do not own this event");
  }

  try {
    await db.delete(events).where(eq(events.id, eventId));
  } catch {
    throw new AppError(
      "This event has existing tickets or orders and can't be deleted",
      409,
      "EVENT_HAS_DEPENDENCIES"
    );
  }
}