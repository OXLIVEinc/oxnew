// client/src/components/organizer/OverviewCards.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Users, Ticket, TrendingUp, DollarSign } from "lucide-react";
import type { OrganizerOverview } from "@/lib/api/organizer";
import { formatNaira } from "@/lib/hotelFormat";

interface Props { overview?: OrganizerOverview; isLoading: boolean; }

export const OverviewCards: React.FC<Props> = ({ overview, isLoading }) => {
  const cards = [
    { label: "Total Events", value: overview?.totalEvents, icon: CalendarDays, accent: "text-blue-600" },
    { label: "Active Events", value: overview?.activeEvents, icon: TrendingUp, accent: "text-emerald-600" },
    { label: "Total Guests", value: overview?.totalGuests, icon: Users, accent: "text-purple-600" },
    { label: "Tickets Sold", value: overview?.ticketsSold, icon: Ticket, accent: "text-amber-600" },
    { label: "Total Revenue", value: overview ? formatNaira(overview.totalRevenue) : undefined, icon: DollarSign, accent: "text-rose-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
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