import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { SEOHead } from "@/components/SEOHead";
import { HotelSidebar, type HotelTab } from "@/components/hotel/HotelSidebar";
import { DashboardPanel } from "@/components/hotel/DashboardPanel";
import { BookingsPanel } from "@/components/hotel/BookingsPanel";
import { BookingDetailDialog } from "@/components/hotel/BookingDetailDialog";
import { RoomTypesPanel } from "@/components/hotel/RoomTypesPanel";
import { HotelProfilePanel } from "@/components/hotel/HotelProfilePanel";
import { AnalyticsPanel } from "@/components/hotel/AnalyticsPanel";
import { PayoutsPanel } from "@/components/hotel/PayoutsPanel";
import { NotificationsPanel } from "@/components/hotel/NotificationsPanel";
import { SettingsPanel } from "@/components/hotel/SettingsPanel";
import { useHotelRealtime } from "@/hooks/useHotelRealtime";
import { useHotelNotifications } from "@/hooks/api/useHotelNotifications";
import { useHotelProfile } from "@/hooks/api/useHotelProfile";
import { storage } from "@/lib/storage";

const TAB_TITLES: Record<HotelTab, string> = {
  dashboard: "Dashboard",
  bookings: "Bookings",
  "room-types": "Room Types",
  profile: "Hotel Profile",
  analytics: "Analytics",
  payouts: "Payouts",
  notifications: "Notifications",
  settings: "Settings",
};

const HotelPartnerDashboard: React.FC = () => {
  const { user, isHotelPartner, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HotelTab>(() =>
  storage.get<HotelTab>("hotel:active-tab", "dashboard")
);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  

  useHotelRealtime();

  const { data: hotel } = useHotelProfile();
  const { data: notifications } = useHotelNotifications();

  useEffect(() => {
    if (!loading && !user) navigate("/");
    if (!loading && user && !isHotelPartner) navigate("/dashboard");
  }, [loading, user, isHotelPartner, navigate]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
  }
  if (!isHotelPartner) return null;

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPanel onSelectBooking={setSelectedBookingId} />;
      case "bookings":
        return <BookingsPanel onSelectBooking={setSelectedBookingId} />;
      case "room-types":
        return <RoomTypesPanel />;
      case "profile":
        return <HotelProfilePanel />;
      case "analytics":
        return <AnalyticsPanel />;
      case "payouts":
        return <PayoutsPanel />;
      case "notifications":
        return <NotificationsPanel />;
      case "settings":
        return <SettingsPanel onGoToProfile={() => setActiveTab("profile")} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SEOHead title="Hotel Partner Dashboard" description="Manage bookings, room types, and payouts" />

      <HotelSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hotelName={hotel?.name ?? "Hotel Partner"}
        unreadCount={notifications?.unreadCount ?? 0}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 sm:px-6 lg:px-8 h-[4.5rem] flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-accent text-foreground"
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">{TAB_TITLES[activeTab]}</h1>
            {activeTab === "dashboard" && hotel && (
              <p className="text-sm text-muted-foreground hidden sm:block">Welcome back, {hotel.name}</p>
            )}
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">{renderContent()}</div>
      </main>


        <BookingDetailDialog bookingId={selectedBookingId} onClose={() => setSelectedBookingId(null)} />
      
    </div>
  );
};

export default HotelPartnerDashboard;
