/**
 * src/lib/api/types.ts
 * -------------------------------------------------------------------------
 * Types for what the backend actually sends over the wire. These are
 * intentionally separate from the Drizzle-inferred `@shared/schema` types
 * (which describe DB rows, e.g. `locationLat` as a string) since the API
 * layer reshapes some fields (e.g. `schedule.date`/`schedule.time`).
 * -------------------------------------------------------------------------
 */

/** The single place that turns startsAt/startTime/endsAt/endTime into what's shown. */
export interface EventSchedule {
  date: string; // "2026-08-14"
  time: string; // "15:00"
  endDate: string | null;
  endTime: string | null;
  isUpcoming: boolean;
}

export interface TicketTier {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  price: string; // numeric columns come back as strings
  isUnlimited: boolean;
  quantity: number | null;
  sold: number;
  isSoldOut: boolean;
  createdAt: string;
}

export interface EventSummary {
  id: string;
  title: string;
  description: string | null;
  schedule: EventSchedule;
  venue: string;
  address: string;
  geocodedAddress: string | null;
  locationLat: string;
  locationLng: string;
  backgroundImageUrl: string;
  mobileBannerUrl: string | null;
  desktopBannerUrl: string | null;
  isPaid: boolean;
  ageGroup: string | null;
  genre: string | null;
  tags: string[];
  status: string;
  approvalStatus: "pending" | "approved" | "rejected";
  isFeatured: boolean;
  eventCode: string;
  createdBy: string;
  likeCount: number;
  registrationCount: number;
  createdAt: string;
}

export interface EventDetail extends EventSummary {
  ticketTiers: TicketTier[];
  gallery: { id: string; mediaUrl: string; mediaType: string; sortOrder: number }[];
}

export interface DiscoverEvent {
  id: string;
  title: string;
  backgroundImageUrl: string;
  venue: string;
  address: string;
  isPaid: boolean;
  genre: string | null;
  tags: string[];
  schedule: EventSchedule;
  likeCount: number;
  registrationCount: number;
  trendingScore?: number;
}

export interface DiscoverFeed {
  featured: DiscoverEvent[];
  trending: DiscoverEvent[];
  thisWeek: DiscoverEvent[];
  daily: DiscoverEvent[];
}

export interface GuestRegisteredEvent {
  id: string;
  title: string;
  backgroundImageUrl: string;
  venue: string;
  address: string;
  status: string;
  schedule: EventSchedule;
  isPast: boolean;
  registeredAt: string;
}

export interface GuestTicket {
  id: string;
  status: "valid" | "transferred" | "used";
  checkedIn: boolean;
  checkedInAt: string | null;
  checkInCode: string;
  /** Public URL of the rendered ticket card (QR baked in) — render as an <img>. */
  qrCode: string;
  attendeeName: string;
  attendeeEmail: string | null;
  tierName: string;
  event: {
    id: string;
    title: string;
    venue: string;
    address: string;
    schedule: EventSchedule;
  };
}

export interface TicketTierFormValues {
  id?: string;
  name: string;
  description?: string | null;
  price?: number | null;
  isUnlimited: boolean;
  quantity?: number | null;
}



export interface CreateEventPayload {
  title: string;
  description?: string;
  startsAt: string;
  startTime: string;
  endsAt?: string | null;
  endTime?: string | null;
  venue: string;
  address: string;
  geocodedAddress: string | null; 
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
  ticketTiers: TicketTierFormValues[];
  gallery?: { mediaUrl: string; mediaType: string }[];
  venueMap?: {
    imageUrl: string;     
  } | null;
}

export interface RegisterInput {
  eventId: string;
  tierId: string;
  attendeeName: string;
  attendeeEmail?: string;
  attendeePhone?: string;
}

export type RegisterResult =
  | { requiresPayment: true; order: Record<string, unknown> }
  | { requiresPayment: false; ticket: GuestTicket };
