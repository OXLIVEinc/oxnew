/**
 * src/hooks/api/useDiscover.ts
 * -------------------------------------------------------------------------
 * One `useDiscoverFeed()` call gets everything the Discover page needs
 * (featured/trending/this-week/daily) in a single request. The individual
 * `useTrendingEvents` etc. hooks exist for anywhere that only needs one rail.
 * -------------------------------------------------------------------------
 */
import { useQuery } from "@tanstack/react-query";
import * as discoverApi from "@/lib/api/discover";
import { queryKeys } from "./queryKeys";

const FIVE_MINUTES = 5 * 60 * 1000;

export function useDiscoverFeed() {
  return useQuery({
    queryKey: queryKeys.discover.feed(),
    queryFn: discoverApi.fetchDiscoverFeed,
    staleTime: FIVE_MINUTES,
  });
}

export function useTrendingEvents() {
  return useQuery({
    queryKey: queryKeys.discover.trending(),
    queryFn: discoverApi.fetchTrendingEvents,
    staleTime: FIVE_MINUTES,
  });
}

export function useThisWeekEvents() {
  return useQuery({
    queryKey: queryKeys.discover.thisWeek(),
    queryFn: discoverApi.fetchThisWeekEvents,
    staleTime: FIVE_MINUTES,
  });
}

export function useDailyEvents() {
  return useQuery({
    queryKey: queryKeys.discover.daily(),
    queryFn: discoverApi.fetchDailyEvents,
    staleTime: FIVE_MINUTES,
  });
}

export function useFeaturedEvents() {
  return useQuery({
    queryKey: queryKeys.discover.featured(),
    queryFn: discoverApi.fetchFeaturedEvents,
    staleTime: FIVE_MINUTES,
  });
}
