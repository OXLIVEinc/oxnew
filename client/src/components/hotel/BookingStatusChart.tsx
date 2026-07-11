/**
 * src/components/hotel/BookingStatusChart.tsx
 * -------------------------------------------------------------------------
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { BookingStatusPoint } from "@/lib/api/hotelTypes";
import { statusLabel } from "@/lib/hotelFormat";

interface Props {
  data?: BookingStatusPoint[];
  isLoading: boolean;
}

export const BookingStatusChart: React.FC<Props> = ({ data, isLoading }) => {
  const chartData = (data ?? []).map((d) => ({ status: statusLabel(d.status), count: d.count }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Booking Status</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-16 text-center">No bookings yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
