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
    <div className="flex flex-col h-full bg-white text-black border-r border-gray-300">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-300">
        <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
          <Building2 size={16} className="text-white" />
        </div>
        <span className="font-semibold text-base tracking-tight truncate text-black">{hotelName || "Hotel Partner"}</span>
        <button onClick={onMobileClose} className="ml-auto lg:hidden p-1 rounded-md hover:bg-gray-100">
          <X size={18} className="text-black" />
        </button>
      </div>

      <div className="px-3 pt-4 pb-2">
        <button
          onClick={() => {
            navigate("/");
            onMobileClose();
          }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-black/70 hover:bg-gray-100 hover:text-black transition-colors"
        >
          <Compass size={18} className="text-black/70" />
          Discover Events
        </button>
      </div>

      <div className="mx-3 border-t border-gray-300" />

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
                  ? "bg-gray-200 text-black font-bold"
                  : "text-black/70 hover:bg-gray-100 hover:text-black"
              }`}
            >
              <Icon size={18} className={isActive ? "text-black" : "text-black/70"} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.key === "notifications" && unreadCount > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 justify-center px-1.5 bg-black text-white border border-black">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Badge>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-300 px-4 py-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-black/70 hover:bg-gray-100 hover:text-black transition-colors"
        >
          <LogOut size={16} className="text-black/70" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-60 xl:w-64 border-r border-gray-300 h-screen sticky top-0 shrink-0 bg-white">
        {content}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white">{content}</aside>
        </div>
      )}
    </>
  );
};