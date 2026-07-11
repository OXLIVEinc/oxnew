import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  QrCode,
  BarChart3,
  Send,
  LogOut,
  X,
  UserCircle,
  Compass,
  PlusCircle,
  Ticket,
  CreditCard,
} from 'lucide-react';

export type DashboardTab = 'overview' | 'events' | 'guests' | 'scanner' | 'analytics' | 'campaigns' | 'brand' | 'tickets' | 'subscription';

interface DashboardSidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  userName: string;
  userRole: string;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems: { key: DashboardTab; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'events', label: 'My Events', icon: CalendarDays },
  { key: 'guests', label: 'Guest List', icon: Users },
  { key: 'scanner', label: 'QR Check-in', icon: QrCode },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'campaigns', label: 'Campaigns', icon: Send },
  { key: 'tickets', label: 'My Tickets', icon: Ticket },
  { key: 'subscription', label: 'Plans & Pricing', icon: CreditCard },
  { key: 'brand', label: 'Brand Profile', icon: UserCircle },
];

const externalLinks = [
  { label: 'Discover Events', icon: Compass, path: '/' },
  { label: 'Create Event', icon: PlusCircle, path: '/create-event' },
];

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  activeTab,
  onTabChange,
  userName,
  userRole,
  isMobileOpen,
  onMobileClose,
}) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14" className="w-4 h-4 text-primary-foreground">
            <path fill="currentColor" stroke="currentColor" strokeWidth="0.5" fillRule="evenodd" d="M1.83645 1.83645C3.06046 0.612432 4.82797 0 7 0s3.9395 0.612432 5.1636 1.83645C13.3876 3.06046 14 4.82797 14 7s-0.6124 3.9395 -1.8364 5.1636C10.9395 13.3876 9.17203 14 7 14s-3.93954 -0.6124 -5.16355 -1.8364C0.612432 10.9395 0 9.17203 0 7s0.612432 -3.93954 1.83645 -5.16355ZM5.0769 4.98816c0 -0.34518 -0.27982 -0.625 -0.625 -0.625 -0.34517 0 -0.625 0.27982 -0.625 0.625v0.7c0 0.34518 0.27983 0.625 0.625 0.625 0.34518 0 0.625 -0.27982 0.625 -0.625v-0.7Zm5.0962 0c0 -0.34518 -0.27983 -0.625 -0.625 -0.625 -0.34518 0 -0.625 0.27982 -0.625 0.625v0.7c0 0.34518 0.27982 0.625 0.625 0.625 0.34517 0 0.625 -0.27982 0.625 -0.625v-0.7Zm0.1787 2.42929c0.3217 0.12505 0.4812 0.48724 0.3561 0.80897 -0.2805 0.72182 -0.75537 1.29603 -1.40641 1.68306 -0.64416 0.38292 -1.4264 0.56282 -2.30149 0.56282 -0.34518 0 -0.625 -0.2798 -0.625 -0.62501 0 -0.34518 0.27982 -0.625 0.625 -0.625 0.7083 0 1.25628 -0.14564 1.66273 -0.38728 0.39956 -0.23753 0.69571 -0.58697 0.88012 -1.06143 0.12505 -0.32173 0.48725 -0.48117 0.80895 -0.35613Z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="font-semibold text-base tracking-tight">EventFlow</span>
        <button onClick={onMobileClose} className="ml-auto lg:hidden p-1 rounded-md hover:bg-sidebar-accent">
          <X size={18} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-3 pt-4 pb-2 space-y-1">
        {externalLinks.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.path}
              onClick={() => {
                navigate(link.path);
                onMobileClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
            >
              <Icon size={18} />
              {link.label}
            </button>
          );
        })}
      </div>

      <div className="mx-3 border-t border-sidebar-border" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                onTabChange(item.key);
                onMobileClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-sidebar-primary' : ''} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User profile footer */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold uppercase text-sidebar-primary">
            {userName ? userName.slice(0, 2) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{userName || 'User'}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{userRole || 'Organizer'}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 xl:w-64 border-r border-sidebar-border h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 animate-slide-in-left">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
