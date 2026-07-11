/**
 * src/components/hotel/RecentActivityLists.tsx
 * -------------------------------------------------------------------------
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { HotelBooking } from "@/lib/api/hotelTypes";
import { formatDate, formatNaira, statusLabel, STATUS_BADGE_VARIANT } from "@/lib/hotelFormat";

interface Props {
  recentBookings?: HotelBooking[];
  upcomingArrivals?: HotelBooking[];
  isLoading: boolean;
  onSelectBooking: (id: string) => void;
}

function BookingRow({ booking, onClick }: { booking: HotelBooking; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{booking.guestName || booking.guestPhone}</p>
        <p className="text-xs text-muted-foreground truncate">
          {booking.roomTypeName} · {formatDate(booking.checkIn)}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className="text-sm font-semibold">{formatNaira(booking.amount)}</span>
        <Badge variant={STATUS_BADGE_VARIANT[booking.status] ?? "outline"} className="text-[10px]">
          {statusLabel(booking.status)}
        </Badge>
      </div>
    </button>
  );
}

export const RecentActivityLists: React.FC<Props> = ({ recentBookings, upcomingArrivals, isLoading, onSelectBooking }) => {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full my-1" />)
          ) : recentBookings && recentBookings.length > 0 ? (
            recentBookings.map((b) => <BookingRow key={b.id} booking={b} onClick={() => onSelectBooking(b.id)} />)
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">No bookings yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Arrivals</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full my-1" />)
          ) : upcomingArrivals && upcomingArrivals.length > 0 ? (
            upcomingArrivals.map((b) => <BookingRow key={b.id} booking={b} onClick={() => onSelectBooking(b.id)} />)
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">No upcoming arrivals</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
