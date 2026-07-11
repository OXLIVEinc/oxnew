/**
 * src/lib/api/discover.ts
 * Request functions for /api/discover
 * -------------------------------------------------------------------------
 */
import { api } from "./http";
import type { DiscoverEvent, DiscoverFeed } from "./types";

export async function fetchDiscoverFeed() {
  const { data } = await api.get<DiscoverFeed>("/discover");
  return data;
}

export async function fetchTrendingEvents() {
  const { data } = await api.get<{ events: DiscoverEvent[] }>("/discover/trending");
  return data.events;
}

export async function fetchThisWeekEvents() {
  const { data } = await api.get<{ events: DiscoverEvent[] }>("/discover/this-week");
  return data.events;
}

export async function fetchDailyEvents() {
  const { data } = await api.get<{ events: DiscoverEvent[] }>("/discover/daily");
  return data.events;
}

export async function fetchFeaturedEvents() {
  const { data } = await api.get<{ events: DiscoverEvent[] }>("/discover/featured");
  return data.events;
}
