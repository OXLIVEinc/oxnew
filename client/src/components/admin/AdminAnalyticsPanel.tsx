import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';

interface DayData {
  date: string;
  count: number;
}

interface TopEvent {
  title: string;
  registrations: number;
}

export function AdminAnalyticsPanel() {
  const [stats, setStats] = useState({ events: 0, eventsMonth: 0, tickets: 0, ticketsMonth: 0, revenue: 0, revenueMonth: 0, users: 0, usersMonth: 0 });
  const [regChart, setRegChart] = useState<DayData[]>([]);
  const [revenueChart, setRevenueChart] = useState<DayData[]>([]);
  const [ticketChart, setTicketChart] = useState<DayData[]>([]);
  const [userChart, setUserChart] = useState<DayData[]>([]);
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

      const [eventsAll, eventsMonth, ticketsAll, ticketsMonth, paymentsAll, paymentsMonth, usersAll, usersMonth, regsRecent, ticketsRecent, paymentsRecent, profilesRecent, regsAll] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }).gte('target_date', monthStart),
        supabase.from('tickets').select('id', { count: 'exact', head: true }),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
        supabase.from('processed_payments').select('metadata'),
        supabase.from('processed_payments').select('metadata').gte('processed_at', monthStart),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthStart),
        supabase.from('event_registrations').select('registered_at').gte('registered_at', thirtyDaysAgo),
        supabase.from('tickets').select('created_at').gte('created_at', thirtyDaysAgo),
        supabase.from('processed_payments').select('processed_at, metadata').gte('processed_at', thirtyDaysAgo),
        supabase.from('profiles').select('created_at').gte('created_at', thirtyDaysAgo),
        supabase.from('event_registrations').select('event_id'),
      ]);

      const sumRevenue = (data: any[] | null) => {
        let total = 0;
        data?.forEach((p: any) => { if (typeof p.metadata?.amount === 'number') total += p.metadata.amount; });
        return total;
      };

      // Build 30-day charts
      const buildDayMap = () => {
        const m: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
          m[new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10)] = 0;
        }
        return m;
      };

      const regMap = buildDayMap();
      regsRecent.data?.forEach((r: any) => { const d = r.registered_at.slice(0, 10); if (regMap[d] !== undefined) regMap[d]++; });

      const tickMap = buildDayMap();
      ticketsRecent.data?.forEach((t: any) => { const d = t.created_at.slice(0, 10); if (tickMap[d] !== undefined) tickMap[d]++; });

      const revMap = buildDayMap();
      paymentsRecent.data?.forEach((p: any) => { const d = p.processed_at.slice(0, 10); if (revMap[d] !== undefined) revMap[d] += typeof p.metadata?.amount === 'number' ? p.metadata.amount : 0; });

      const usrMap = buildDayMap();
      profilesRecent.data?.forEach((p: any) => { const d = p.created_at.slice(0, 10); if (usrMap[d] !== undefined) usrMap[d]++; });

      const toChartData = (m: Record<string, number>) => Object.entries(m).map(([date, count]) => ({ date: date.slice(5), count }));

      // Top events
      const regCountMap: Record<string, number> = {};
      regsAll.data?.forEach((r: any) => { regCountMap[r.event_id] = (regCountMap[r.event_id] || 0) + 1; });
      const topIds = Object.entries(regCountMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
      let topEvts: TopEvent[] = [];
      if (topIds.length > 0) {
        const { data: evts } = await supabase.from('events').select('id, title').in('id', topIds.map(([id]) => id));
        if (evts) topEvts = topIds.map(([id, count]) => ({ title: evts.find(e => e.id === id)?.title || 'Unknown', registrations: count }));
      }

      setRegChart(toChartData(regMap));
      setTicketChart(toChartData(tickMap));
      setRevenueChart(toChartData(revMap));
      setUserChart(toChartData(usrMap));
      setTopEvents(topEvts);
      setStats({
        events: eventsAll.count || 0,
        eventsMonth: eventsMonth.count || 0,
        tickets: ticketsAll.count || 0,
        ticketsMonth: ticketsMonth.count || 0,
        revenue: sumRevenue(paymentsAll.data),
        revenueMonth: sumRevenue(paymentsMonth.data),
        users: usersAll.count || 0,
        usersMonth: usersMonth.count || 0,
      });
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div className="text-muted-foreground">Loading analytics...</div>;

  const statCards = [
    { label: 'Events', all: stats.events, month: stats.eventsMonth },
    { label: 'Tickets Sold', all: stats.tickets, month: stats.ticketsMonth },
    { label: 'Revenue', all: `₦${stats.revenue.toLocaleString()}`, month: `₦${stats.revenueMonth.toLocaleString()}` },
    { label: 'Users', all: stats.users, month: stats.usersMonth },
  ];

  const tooltipStyle = { backgroundColor: 'hsl(222,84%,4.9%)', border: '1px solid hsl(217,33%,17.5%)', color: '#fff' };

  const charts = [
    { title: 'Registrations (30 Days)', data: regChart, color: 'hsl(210, 80%, 60%)' },
    { title: 'Tickets Sold (30 Days)', data: ticketChart, color: 'hsl(150, 70%, 50%)' },
    { title: 'Revenue (30 Days)', data: revenueChart, color: 'hsl(45, 90%, 60%)' },
    { title: 'User Growth (30 Days)', data: userChart, color: 'hsl(280, 70%, 60%)' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{c.label}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.all}</div>
              <p className="text-xs text-muted-foreground mt-1">This month: {c.month}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {charts.map((ch) => (
          <Card key={ch.title}>
            <CardHeader><CardTitle className="text-base">{ch.title}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ch.data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area type="monotone" dataKey="count" fill={ch.color} fillOpacity={0.15} stroke={ch.color} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {topEvents.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Top Performing Events</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEvents.map((e, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm"><span className="text-muted-foreground mr-2">#{i + 1}</span>{e.title}</span>
                  <span className="text-sm font-bold">{e.registrations} registrations</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
