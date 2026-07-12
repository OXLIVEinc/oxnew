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

  const isBusy = confirm.isPending || decline.isPending || checkIn.isPending || complete.isPending;

  return (
    <Dialog open={Boolean(bookingId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden sm:max-w-2xl">
        <DialogHeader className="px-6 py-4 border-b bg-muted/50">
          <DialogTitle className="text-xl font-semibold">Booking Details</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[85vh] p-6 space-y-8">
          {isLoading || !booking ? (
            <div className="space-y-8">
              <Skeleton className="h-6 w-40" />
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-20 w-full" />
                </div>
                <div className="space-y-4">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
              <Skeleton className="h-px w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <>
              {/* Header Info */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-muted-foreground tracking-wider">
                  {booking.reference}
                </span>
                <Badge variant={STATUS_BADGE_VARIANT[booking.status] ?? "outline"} className="capitalize">
                  {statusLabel(booking.status)}
                </Badge>
              </div>

              {/* Guest Information */}
              <section>
                <h4 className="text-sm font-semibold mb-3 text-foreground">Guest Information</h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground mb-1">Full Name</dt>
                    <dd className="font-medium">{booking.guestName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Phone Number</dt>
                    <dd>{booking.guestPhone}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Email Address</dt>
                    <dd className="break-all">{booking.guestEmail || "—"}</dd>
                  </div>
                </dl>
              </section>

              <Separator />

              {/* Booking Information */}
              <section>
                <h4 className="text-sm font-semibold mb-3 text-foreground">Booking Information</h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground mb-1">Room Type</dt>
                    <dd className="font-medium">{booking.roomTypeName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Number of Guests</dt>
                    <dd>{booking.guests}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Check-in Date</dt>
                    <dd>{formatDateTime(booking.checkIn)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Check-out Date</dt>
                    <dd>{formatDateTime(booking.checkOut)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Nights</dt>
                    <dd className="font-medium">{booking.nights}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Checked In</dt>
                    <dd className="font-medium">{booking.checkedIn ? "Yes" : "No"}</dd>
                  </div>
                </dl>
              </section>

              <Separator />

              {/* Payment Information */}
              <section>
                <h4 className="text-sm font-semibold mb-3 text-foreground">Payment Information</h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground mb-1">Price per Night</dt>
                    <dd>{formatNaira(booking.pricePerNight)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Subtotal</dt>
                    <dd>{formatNaira(booking.subtotal)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Service Fee</dt>
                    <dd>{formatNaira(booking.serviceFee)}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground mb-1">Total Paid</dt>
                    <dd className="font-semibold text-lg tracking-tight">{formatNaira(booking.amount)}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground mb-1">Provider Reference</dt>
                    <dd className="font-mono text-xs break-all text-muted-foreground">
                      {booking.reference || "—"}
                    </dd>
                  </div>
                </dl>
              </section>

              {/* Special Requests */}
              {booking.specialRequests && (
                <>
                  <Separator />
                  <section>
                    <h4 className="text-sm font-semibold mb-3 text-foreground">Special Requests</h4>
                    <div className="bg-muted/50 border rounded-lg p-4 text-sm">
                      {booking.specialRequests}
                    </div>
                  </section>
                </>
              )}

              <Separator />

              {/* Timeline */}
              <section>
                <h4 className="text-sm font-semibold mb-3 text-foreground">Booking Timeline</h4>
                <div className="space-y-4">
                  {booking.timeline.map((event, index) => (
                    <div key={index} className="flex justify-between items-center text-sm border-l-2 border-muted pl-4">
                      <span>{event.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDateTime(event.at)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Action Buttons */}
              {booking.validActions.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-3 pt-2">
                    {booking.validActions.includes("confirm") && (
                      <Button onClick={() => confirm.mutate(booking.id)} disabled={isBusy} size="default">
                        Confirm Booking
                      </Button>
                    )}

                    {booking.validActions.includes("decline") && (
                      <Button
                        variant="destructive"
                        onClick={() => decline.mutate(booking.id)}
                        disabled={isBusy}
                      >
                        Decline Booking
                      </Button>
                    )}

                    {booking.validActions.includes("check_in") && (
                      <Button
                        variant="outline"
                        onClick={() => checkIn.mutate(booking.id)}
                        disabled={isBusy}
                      >
                        Mark as Checked In
                      </Button>
                    )}

                    {booking.validActions.includes("complete") && (
                      <Button
                        variant="outline"
                        onClick={() => complete.mutate(booking.id)}
                        disabled={isBusy}
                      >
                        Mark as Completed
                      </Button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};