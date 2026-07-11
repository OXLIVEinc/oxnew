/**
 * src/components/hotel/HotelSidebar.tsx
 * -------------------------------------------------------------------------
 */
import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Building2,
  BarChart3,
  Wallet,
  Bell,
  Settings,
  LogOut,
  X,
  Compass,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { storage } from "@/lib/storage";

export type HotelTab =
  | "dashboard"
  | "bookings"
  | "room-types"
  | "profile"
  | "analytics"
  | "payouts"
  | "notifications"
  | "settings";

interface HotelSidebarProps {
  activeTab: HotelTab;
  onTabChange: (tab: HotelTab) => void;
  hotelName: string;
  unreadCount: number;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems: { key: HotelTab; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "bookings", label: "Bookings", icon: CalendarCheck },
  { key: "room-types", label: "Room Types", icon: BedDouble },
  { key: "profile", label: "Hotel Profile", icon: Building2 },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "payouts", label: "Payouts", icon: Wallet },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "settings", label: "Settings", icon: Settings },
];

export const HotelSidebar: React.FC<HotelSidebarProps> = ({
  activeTab,
  onTabChange,
  hotelName,
  unreadCount,
  isMobileOpen,
  onMobileClose,
}) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const content = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Building2 size={16} className="text-primary-foreground" />
        </div>
        <span className="font-semibold text-base tracking-tight truncate">{hotelName || "Hotel Partner"}</span>
        <button onClick={onMobileClose} className="ml-auto lg:hidden p-1 rounded-md hover:bg-sidebar-accent">
          <X size={18} />
        </button>
      </div>

      <div className="px-3 pt-4 pb-2">
        <button
          onClick={() => {
            navigate("/");
            onMobileClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <Compass size={18} />
          Discover Events
        </button>
      </div>

      <div className="mx-3 border-t border-sidebar-border" />

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
  storage.set("hotel:active-tab", item.key);
  onTabChange(item.key);
  onMobileClose();
}}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <Icon size={18} className={isActive ? "text-sidebar-primary" : ""} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.key === "notifications" && unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1.5">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-60 xl:w-64 border-r border-sidebar-border h-screen sticky top-0 shrink-0">
        {content}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72">{content}</aside>
        </div>
      )}
    </>
  );
};
