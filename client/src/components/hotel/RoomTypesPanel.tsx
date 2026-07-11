/**
 * src/components/hotel/RoomTypesPanel.tsx
 * -------------------------------------------------------------------------
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useDeleteRoomType, useHotelRoomTypes } from "@/hooks/api/useHotelRoomTypes";
import type { HotelRoomType } from "@/lib/api/hotelTypes";
import { formatNaira } from "@/lib/hotelFormat";
import { RoomTypeFormDialog } from "./RoomTypeFormDialog";

export const RoomTypesPanel: React.FC = () => {
  const { data: roomTypes, isLoading } = useHotelRoomTypes();
  const deleteRoomType = useDeleteRoomType();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HotelRoomType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (rt: HotelRoomType) => {
    setEditing(rt);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Room Types</h2>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Room Type
        </Button>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : roomTypes && roomTypes.length > 0 ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {roomTypes.map((rt) => (
            <Card key={rt.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{rt.name}</CardTitle>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(rt)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeletingId(rt.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {rt.description && <p className="text-sm text-muted-foreground line-clamp-2">{rt.description}</p>}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{formatNaira(rt.pricePerNight)} / night</span>
                  <Badge variant="outline" className="gap-1">
                    <Users className="h-3 w-3" /> {rt.capacity}
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {rt.occupied} of {rt.quantity} occupied
                    </span>
                    <span>{rt.available} available</span>
                  </div>
                  <Progress value={rt.occupancyRate} />
                </div>
                {rt.upcomingBookings > 0 && (
                  <p className="text-xs text-muted-foreground">{rt.upcomingBookings} upcoming booking(s)</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No room types yet. Create your first one to start accepting bookings.
          </CardContent>
        </Card>
      )}

      <RoomTypeFormDialog open={formOpen} onClose={() => setFormOpen(false)} roomType={editing} />

      <AlertDialog open={Boolean(deletingId)} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this room type?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. Room types with active bookings can't be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingId) deleteRoomType.mutate(deletingId);
                setDeletingId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
