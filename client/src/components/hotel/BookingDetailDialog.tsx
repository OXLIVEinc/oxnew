/**
 * src/components/hotel/BookingDetailDialog.tsx
 * -------------------------------------------------------------------------
 */
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useHotelBooking, useCheckInBooking, useCompleteBooking, useConfirmBooking, useDeclineBooking } from "@/hooks/api/useHotelBookings";
import { formatDateTime, formatNaira, statusLabel, STATUS_BADGE_VARIANT } from "@/lib/hotelFormat";

interface Props {
  bookingId: string | null;
  onClose: () => void;
}

export const BookingDetailDialog: React.FC<Props> = ({ bookingId, onClose }) => {
  const { data: booking, isLoading } = useHotelBooking(bookingId ?? undefined);
  const confirm = useConfirmBooking();
  const decline = useDeclineBooking();
  const checkIn = useCheckInBooking();
  const complete = useCompleteBooking();

  const busy = confirm.isPending || decline.isPending || checkIn.isPending || complete.isPending;

  return (
    <Dialog open={Boolean(bookingId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Booking Details</DialogTitle>
        </DialogHeader>

        {isLoading || !booking ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm text-muted-foreground">{booking.reference}</span>
              <Badge variant={STATUS_BADGE_VARIANT[booking.status] ?? "outline"}>{statusLabel(booking.status)}</Badge>
            </div>

            <section>
              <h4 className="text-sm font-semibold mb-2">Guest Information</h4>
              <dl className="grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Name</dt>
                <dd>{booking.guestName || "—"}</dd>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{booking.guestPhone}</dd>
                <dt className="text-muted-foreground">Email</dt>
                <dd>{booking.guestEmail || "—"}</dd>
              </dl>
            </section>

            <Separator />

            <section>
              <h4 className="text-sm font-semibold mb-2">Booking Information</h4>
              <dl className="grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Room Type</dt>
                <dd>{booking.roomTypeName}</dd>
                <dt className="text-muted-foreground">Guests</dt>
                <dd>{booking.guests}</dd>
                <dt className="text-muted-foreground">Check-in</dt>
                <dd>{formatDateTime(booking.checkIn)}</dd>
                <dt className="text-muted-foreground">Check-out</dt>
                <dd>{formatDateTime(booking.checkOut)}</dd>
                <dt className="text-muted-foreground">Nights</dt>
                <dd>{booking.nights}</dd>
                <dt className="text-muted-foreground">Checked in</dt>
                <dd>{booking.checkedIn ? "Yes" : "No"}</dd>
              </dl>
            </section>

            <Separator />

            <section>
              <h4 className="text-sm font-semibold mb-2">Payment Information</h4>
              <dl className="grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-muted-foreground">Price / Night</dt>
                <dd>{formatNaira(booking.pricePerNight)}</dd>
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatNaira(booking.subtotal)}</dd>
                <dt className="text-muted-foreground">Service Fee</dt>
                <dd>{formatNaira(booking.serviceFee)}</dd>
                <dt className="text-muted-foreground">Total Paid</dt>
                <dd className="font-semibold">{formatNaira(booking.amount)}</dd>
                <dt className="text-muted-foreground">Provider Ref</dt>
                <dd className="truncate">{booking.paystackReference || "—"}</dd>
              </dl>
            </section>

            {booking.specialRequests && (
              <>
                <Separator />
                <section>
                  <h4 className="text-sm font-semibold mb-2">Special Requests</h4>
                  <p className="text-sm text-muted-foreground">{booking.specialRequests}</p>
                </section>
              </>
            )}

            <Separator />

            <section>
              <h4 className="text-sm font-semibold mb-2">Booking Timeline</h4>
              <ol className="space-y-2">
                {booking.timeline.map((event, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span>{event.label}</span>
                    <span className="text-muted-foreground text-xs">{formatDateTime(event.at)}</span>
                  </li>
                ))}
              </ol>
            </section>

            {booking.validActions.length > 0 && (
              <>
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {booking.validActions.includes("confirm") && (
                    <Button disabled={busy} onClick={() => confirm.mutate(booking.id)}>
                      Confirm Booking
                    </Button>
                  )}
                  {booking.validActions.includes("decline") && (
                    <Button variant="destructive" disabled={busy} onClick={() => decline.mutate(booking.id)}>
                      Decline Booking
                    </Button>
                  )}
                  {booking.validActions.includes("check_in") && (
                    <Button variant="outline" disabled={busy} onClick={() => checkIn.mutate(booking.id)}>
                      Mark Checked In
                    </Button>
                  )}
                  {booking.validActions.includes("complete") && (
                    <Button variant="outline" disabled={busy} onClick={() => complete.mutate(booking.id)}>
                      Mark Completed
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
