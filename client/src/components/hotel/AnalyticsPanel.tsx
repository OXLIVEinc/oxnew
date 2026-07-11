/**
 * src/components/hotel/AnalyticsPanel.tsx
 * -------------------------------------------------------------------------
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useHotelAnalytics } from "@/hooks/api/useHotelAnalytics";
import { formatNaira, statusLabel } from "@/lib/hotelFormat";

export const AnalyticsPanel: React.FC = () => {
  const { data, isLoading } = useHotelAnalytics();

  if (isLoading || !data) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Occupancy Rate</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.occupancy.occupancyRate}%</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Average Stay</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.averageStayLength} nights</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Most Booked Room</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold truncate">
            {data.mostBookedRoomType?.roomTypeName ?? "—"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Occupied Rooms</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {data.occupancy.occupiedRooms}/{data.occupancy.totalRooms}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.revenueByMonth} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${Number(v) / 1000}k`} />
                <Tooltip formatter={(value: number) => formatNaira(value)} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bookings by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.bookingsByMonth} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Booking Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {data.statusDistribution.map((s) => (
              <div key={s.status} className="min-w-[120px]">
                <p className="text-xs text-muted-foreground">{statusLabel(s.status)}</p>
                <p className="text-xl font-semibold">{s.count}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
