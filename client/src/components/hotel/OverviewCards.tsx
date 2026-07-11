/**
 * src/components/hotel/OverviewCards.tsx
 * -------------------------------------------------------------------------
 */
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarCheck, CalendarX, CheckCircle2, Clock, DoorOpen, Receipt, TrendingUp, Wallet } from "lucide-react";
import type { DashboardOverview } from "@/lib/api/hotelTypes";
import { formatNaira } from "@/lib/hotelFormat";

interface Props {
  overview?: DashboardOverview;
  isLoading: boolean;
}

export const OverviewCards: React.FC<Props> = ({ overview, isLoading }) => {
  const cards = [
    { label: "Pending Confirmations", value: overview?.pendingConfirmations, icon: Clock, accent: "text-amber-600" },
    { label: "Today's Check-ins", value: overview?.todaysCheckIns, icon: DoorOpen, accent: "text-blue-600" },
    { label: "Today's Check-outs", value: overview?.todaysCheckOuts, icon: CalendarX, accent: "text-purple-600" },
    { label: "Confirmed Bookings", value: overview?.confirmedBookings, icon: CalendarCheck, accent: "text-emerald-600" },
    { label: "Completed Bookings", value: overview?.completedBookings, icon: CheckCircle2, accent: "text-teal-600" },
    { label: "Revenue Today", value: overview ? formatNaira(overview.revenueToday) : undefined, icon: Receipt, accent: "text-rose-600" },
    { label: "Revenue This Month", value: overview ? formatNaira(overview.revenueThisMonth) : undefined, icon: TrendingUp, accent: "text-indigo-600" },
    { label: "Total Bookings", value: overview?.totalBookings, icon: Wallet, accent: "text-slate-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
              <Icon className={`h-4 w-4 ${card.accent}`} />
            </CardHeader>
            <CardContent>
              {isLoading || card.value === undefined ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <div className="text-2xl font-bold">{card.value}</div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
