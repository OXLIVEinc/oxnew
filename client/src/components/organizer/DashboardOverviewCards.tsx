import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { DollarSign, Ticket, CalendarDays, Users, TrendingUp } from 'lucide-react';

interface StatsData {
  totalRevenue: number;
  ticketsSold: number;
  activeEvents: number;
  totalGuests: number;
}

export const DashboardOverviewCards: React.FC = () => {
  const { user } = useUserRole();
  const [stats, setStats] = useState<StatsData>({ totalRevenue: 0, ticketsSold: 0, activeEvents: 0, totalGuests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);

    // Get organizer's events
    const { data: events } = await supabase
      .from('events')
      .select('id, status')
      .eq('created_by', user.id);

    const eventIds = events?.map(e => e.id) || [];
    const activeEvents = events?.filter(e => e.status === 'active').length || 0;

    let ticketsSold = 0;
    let totalGuests = 0;

    if (eventIds.length > 0) {
      const { count: regCount } = await supabase
        .from('event_registrations')
        .select('*', { count: 'exact', head: true })
        .in('event_id', eventIds);

      const { count: ticketCount } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .in('event_id', eventIds);

      totalGuests = regCount || 0;
      ticketsSold = ticketCount || 0;
    }

    setStats({ totalRevenue: 0, ticketsSold, activeEvents, totalGuests });
    setLoading(false);
  };

  const cards = [
    { label: 'Total Revenue', value: `₦${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'hsl(280, 80%, 60%)' },
    { label: 'Tickets Sold', value: stats.ticketsSold.toString(), icon: Ticket, color: 'hsl(340, 80%, 55%)' },
    { label: 'Active Events', value: stats.activeEvents.toString(), icon: CalendarDays, color: 'hsl(200, 80%, 55%)' },
    { label: 'Total Guests', value: stats.totalGuests.toString(), icon: Users, color: 'hsl(150, 60%, 45%)' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-10 w-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}20` }}>
                <Icon size={20} style={{ color: card.color }} />
              </div>
              <TrendingUp size={16} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
              <p className="text-2xl font-semibold text-foreground mt-0.5">
                {loading ? '—' : card.value}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
