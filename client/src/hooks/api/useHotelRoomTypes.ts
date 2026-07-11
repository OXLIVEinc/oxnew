/**
 * src/hooks/api/useHotelRoomTypes.ts
 * -------------------------------------------------------------------------
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as roomTypesApi from "@/lib/api/hotelRoomTypes";
import type { RoomTypeInput } from "@/lib/api/hotelTypes";
import { getApiErrorMessage } from "@/lib/api/http";
import { queryKeys } from "./queryKeys";

export function useHotelRoomTypes() {
  return useQuery({
    queryKey: queryKeys.hotel.roomTypes(),
    queryFn: roomTypesApi.fetchRoomTypes,
  });
}

export function useCreateRoomType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: RoomTypeInput) => roomTypesApi.createRoomType(input),
    onSuccess: () => {
      toast.success("Room type created");
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.roomTypes() });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Couldn't create room type")),
  });
}

export function useUpdateRoomType(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<RoomTypeInput>) => roomTypesApi.updateRoomType(id, patch),
    onSuccess: () => {
      toast.success("Room type updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.roomTypes() });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Couldn't update room type")),
  });
}

export function useDeleteRoomType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => roomTypesApi.deleteRoomType(id),
    onSuccess: () => {
      toast.success("Room type deleted");
      queryClient.invalidateQueries({ queryKey: queryKeys.hotel.roomTypes() });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Couldn't delete room type")),
  });
}
