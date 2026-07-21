import { type ReactNode } from 'react';
import {
  LayoutDashboard, CalendarDays, Users, Ticket, CreditCard,
  Crown, BarChart3, LogOut, Mail,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

export type AdminTab = 'overview' | 'events' | 'organizers' | 'tickets' | 'payments' | 'subscriptions' | 'analytics' | 'broadcast';

const navItems: { key: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'events', label: 'Events', icon: CalendarDays },
  { key: 'organizers', label: 'Organizers', icon: Users },
  { key: 'tickets', label: 'Guests & Tickets', icon: Ticket },
  { key: 'payments', label: 'Payments & Revenue', icon: CreditCard },
  { key: 'subscriptions', label: 'Subscriptions', icon: Crown },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'broadcast', label: 'Broadcast', icon: Mail },
];

interface Props {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onSignOut: () => void;
  adminName: string;
  children: ReactNode;
}

export function AdminLayout({ activeTab, onTabChange, onSignOut, adminName, children }: Props) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground">
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <h2 className="text-lg font-bold tracking-tight text-sidebar-foreground">OX Internal</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        isActive={activeTab === item.key}
                        onClick={() => onTabChange(item.key)}
                        tooltip={item.label}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border space-y-2">
            <div className="text-xs text-sidebar-foreground/60 truncate">Signed in as <span className="font-medium text-sidebar-foreground">{adminName}</span></div>
            <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:text-sidebar-primary-foreground" onClick={onSignOut}>
              <LogOut className="h-4 w-4" /> Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 gap-4 bg-background">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold capitalize">
              {activeTab === 'overview' ? 'Dashboard Overview' : navItems.find(n => n.key === activeTab)?.label || activeTab}
            </h1>
          </header>
          <main className="flex-1 p-6 overflow-auto bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
