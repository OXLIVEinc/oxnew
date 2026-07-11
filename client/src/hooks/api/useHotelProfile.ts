/**
 * src/hooks/api/useHotelProfile.ts
 * -------------------------------------------------------------------------
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as profileApi from "@/lib/api/hotelProfile";
import type { HotelProfileInput } from "@/lib/api/hotelTypes";
import { getApiErrorMessage } from "@/lib/api/http";
import { queryKeys } from "./queryKeys";

export function useHotelProfile() {
  return useQuery({
    queryKey: queryKeys.hotel.profile(),
    queryFn: profileApi.fetchHotelProfile,
  });
}

export function useUpdateHotelProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: HotelProfileInput) => profileApi.updateHotelProfile(patch),
    onSuccess: () => {
      toast.success("Hotel profile updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.profile() });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Couldn't update hotel profile")),
  });
}
