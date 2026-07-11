/**
 * src/components/hotel/RevenueChart.tsx
 * -------------------------------------------------------------------------
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { RevenuePoint } from "@/lib/api/hotelTypes";
import { formatNaira } from "@/lib/hotelFormat";

interface Props {
  data?: RevenuePoint[];
  isLoading: boolean;
}

export const RevenueChart: React.FC<Props> = ({ data, isLoading }) => {
  const chartData = (data ?? []).map((d) => ({
    label: new Date(d.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
    revenue: d.revenue,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Revenue (Last 14 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="hotelRevenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${Number(v) / 1000}k`} />
              <Tooltip formatter={(value: number) => formatNaira(value)} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#hotelRevenueFill)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
