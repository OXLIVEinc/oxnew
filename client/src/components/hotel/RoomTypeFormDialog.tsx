/**
 * src/components/hotel/RoomTypeFormDialog.tsx
 * -------------------------------------------------------------------------
 */
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRoomType, useUpdateRoomType } from "@/hooks/api/useHotelRoomTypes";
import type { HotelRoomType } from "@/lib/api/hotelTypes";

interface Props {
  open: boolean;
  onClose: () => void;
  roomType: HotelRoomType | null;
}

export const RoomTypeFormDialog: React.FC<Props> = ({ open, onClose, roomType }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [quantity, setQuantity] = useState("10");

  const create = useCreateRoomType();
  const update = useUpdateRoomType(roomType?.id ?? "");
  const saving = create.isPending || update.isPending;

  useEffect(() => {
    if (open) {
      setName(roomType?.name ?? "");
      setDescription(roomType?.description ?? "");
      setPrice(roomType?.pricePerNight ?? "");
      setCapacity(String(roomType?.capacity ?? 2));
      setQuantity(String(roomType?.quantity ?? 10));
    }
  }, [open, roomType]);

  const handleSubmit = async () => {
    const input = {
      name,
      description: description || null,
      pricePerNight: Number(price),
      capacity: Number(capacity),
      quantity: Number(quantity),
    };

    if (roomType) {
      await update.mutateAsync(input);
    } else {
      await create.mutateAsync(input);
    }
    onClose();
  };

  const valid = name.trim().length > 0 && Number(price) > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{roomType ? "Edit Room Type" : "Create Room Type"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="rt-name">Name</Label>
            <Input id="rt-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Deluxe King Room" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rt-description">Description</Label>
            <Textarea
              id="rt-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Spacious room with a king bed and city view"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rt-price">Price / Night (₦)</Label>
              <Input id="rt-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rt-capacity">Capacity</Label>
              <Input id="rt-capacity" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rt-quantity">Quantity</Label>
              <Input id="rt-quantity" type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || saving}>
            {roomType ? "Save Changes" : "Create Room Type"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
