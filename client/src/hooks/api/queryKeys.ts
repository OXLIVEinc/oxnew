/**
 * src/hooks/api/queryKeys.ts
 * -------------------------------------------------------------------------
 * One place for every TanStack Query key used against our backend. Using
 * factories like this (instead of ad-hoc arrays in each hook) means
 * `queryClient.invalidateQueries({ queryKey: queryKeys.events.all })`
 * always matches every related query, and renaming a resource means
 * changing it in exactly one place.
 * -------------------------------------------------------------------------
 */
export const queryKeys = {
  events: {
    all: ["events"] as const,
    list: (params?: Record<string, unknown>) => ["events", "list", params ?? {}] as const,
    detail: (id: string) => ["events", "detail", id] as const,
    mine: () => ["events", "mine"] as const,
  },
  ticketTiers: {
    all: (eventId: string) => ["ticket-tiers", eventId] as const,
  },
  discover: {
    feed: () => ["discover", "feed"] as const,
    trending: () => ["discover", "trending"] as const,
    thisWeek: () => ["discover", "this-week"] as const,
    daily: () => ["discover", "daily"] as const,
    featured: () => ["discover", "featured"] as const,
  },
  guest: {
    events: (filter: string) => ["guest", "events", filter] as const,
    tickets: () => ["guest", "tickets"] as const,
  },
  hotel: {
    overview: () => ["hotel", "overview"] as const,
    activity: () => ["hotel", "activity"] as const,
    statusChart: () => ["hotel", "charts", "status"] as const,
    revenueChart: () => ["hotel", "charts", "revenue"] as const,
    bookings: {
      all: ["hotel", "bookings"] as const,
     list: <T extends object>(params?: T) =>
  ["hotel", "bookings", "list", params ?? {}] as const,
      detail: (id: string) => ["hotel", "bookings", "detail", id] as const,
    },
    roomTypes: () => ["hotel", "room-types"] as const,
    profile: () => ["hotel", "profile"] as const,
    analytics: () => ["hotel", "analytics"] as const,
    payouts: () => ["hotel", "payouts"] as const,
    notifications: (page?: number) => ["hotel", "notifications", page ?? 1] as const,
  },
} as const;
