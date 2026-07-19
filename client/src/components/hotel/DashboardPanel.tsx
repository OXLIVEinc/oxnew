import React from "react";
import { useHotelActivity, useHotelOverview, useHotelRevenueChart, useHotelStatusChart } from "@/hooks/api/useHotelDashboard";
import { OverviewCards } from "./OverviewCards";
import { RecentActivityLists } from "./RecentActivityLists";
import { BookingStatusChart } from "./BookingStatusChart";
import { RevenueChart } from "./RevenueChart";

interface Props {
  onSelectBooking: (id: string) => void;
}

export const DashboardPanel: React.FC<Props> = ({ onSelectBooking }) => {
  const { data: overview, isLoading: overviewLoading } = useHotelOverview();
  const { data: activity, isLoading: activityLoading } = useHotelActivity();
  const { data: statusData, isLoading: statusLoading } = useHotelStatusChart();
  const { data: revenueData, isLoading: revenueLoading } = useHotelRevenueChart();

  return (
    <div className="space-y-6">
      <OverviewCards overview={overview} isLoading={overviewLoading} />

      <RecentActivityLists
        recentBookings={activity?.recentBookings}
        upcomingArrivals={activity?.upcomingArrivals}
        isLoading={activityLoading}
        onSelectBooking={onSelectBooking}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <BookingStatusChart data={statusData} isLoading={statusLoading} />
        <RevenueChart data={revenueData} isLoading={revenueLoading} />
      </div>
    </div>
  );
};
