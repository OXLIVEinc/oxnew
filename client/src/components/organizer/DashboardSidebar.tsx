// client/src/components/organizer/DashboardSidebar.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, CalendarDays, Users, QrCode, BarChart3, Send, LogOut, X, UserCircle, Compass, Ticket, CreditCard,
} from "lucide-react";

export type DashboardTab = "overview" | "events" | "guests" | "scanner" | "analytics" | "campaigns" | "brand" | "tickets" | "subscription";

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  userName: string;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems: { key: DashboardTab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Dashboard", icon: LayoutDashboard },
  { key: "events", label: "My Events", icon: CalendarDays },
  { key: "guests", label: "Guest List", icon: Users },
  { key: "scanner", label: "QR Check-in", icon: QrCode },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "campaigns", label: "Campaigns", icon: Send },
  { key: "tickets", label: "My Tickets", icon: Ticket },
  { key: "subscription", label: "Plans & Pricing", icon: CreditCard },
  { key: "brand", label: "Brand Profile", icon: UserCircle },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ activeTab, onTabChange, userName, isMobileOpen, onMobileClose }) => {
  const navigate = useNavigate();
  const handleSignOut = async () => { await supabase.auth.signOut(); navigate("/"); };

  const content = (
    <div className="flex flex-col h-full bg-white text-black  border-gray-300">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-300">
        <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
          <CalendarDays size={16} className="text-white" />
        </div>
        <span className="font-semibold text-base tracking-tight truncate">{userName || "Organizer"}</span>
        <button onClick={onMobileClose} className="ml-auto lg:hidden p-1 rounded-md hover:bg-gray-100"><X size={18} /></button>
      </div>

      <div className="px-3 pt-4 pb-2">
        <button onClick={() => { navigate("/"); onMobileClose(); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-black/70 hover:bg-gray-100 hover:text-black transition-colors">
          <Compass size={18} className="text-black/70" /> Discover Events
        </button>
      </div>

      <div className="mx-3 border-t border-gray-300" />

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button key={item.key} onClick={() => { onTabChange(item.key); onMobileClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-gray-200 text-black font-bold" : "text-black/70 hover:bg-gray-100 hover:text-black"}`}>
              <Icon size={18} className={isActive ? "text-black" : "text-black/70"} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-300 px-4 py-4">
        <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-black/70 hover:bg-gray-100 hover:text-black transition-colors">
          <LogOut size={16} /> Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex lg:flex-col lg:w-60 xl:w-64 border-r border-gray-300 h-screen sticky top-0 shrink-0 bg-white">{content}</aside>
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white">{content}</aside>
        </div>
      )}
    </>
  );
};