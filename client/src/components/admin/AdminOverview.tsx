import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarDays, Ticket, CreditCard, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface Stats {
  totalEvents: number;
  totalTickets: number;
  totalRevenue: number;
  totalUsers: number;
}

interface TopEvent {
  id: string;
  title: string;
  registrations: number;
}

interface RecentPayment {
  id: string;
  reference: string;
  userName: string;
  amount: number;
  type: string;
  date: string;
}

interface ChartDay {
  date: string;
  registrations: number;
  revenue: number;
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats>({ totalEvents: 0, totalTickets: 0, totalRevenue: 0, totalUsers: 0 });
  const [topEvents, setTopEvents] = useState<TopEvent[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString();

      const [eventsRes, ticketsRes, paymentsRes, usersRes, regsRes, regsRecentRes, profilesRes, upcomingRes] = await Promise.all([
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('tickets').select('id', { count: 'exact', head: true }),
        supabase.from('processed_payments').select('*').order('processed_at', { ascending: false }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('event_registrations').select('event_id'),
        supabase.from('event_registrations').select('registered_at').gte('registered_at', thirtyDaysAgo),
        supabase.from('profiles').select('user_id, display_name'),
        supabase.from('events').select('id, title, date, target_date').eq('status', 'active').gte('target_date', new Date().toISOString()).order('target_date', { ascending: true }).limit(5),
      ]);

      let revenue = 0;
      const profileMap: Record<string, string> = {};
      profilesRes.data?.forEach((p: any) => { profileMap[p.user_id] = p.display_name || 'Unknown'; });

      // Recent payments
      const recent: RecentPayment[] = [];
      paymentsRes.data?.forEach((p: any) => {
        const amt = typeof p.metadata?.amount === 'number' ? p.metadata.amount : 0;
        revenue += amt;
        if (recent.length < 10) {
          recent.push({
            id: p.id,
            reference: p.reference,
            userName: profileMap[p.user_id] || 'Unknown',
            amount: amt,
            type: p.payment_type,
            date: new Date(p.processed_at).toLocaleDateString(),
          });
        }
      });

      // Top events
      const regMap: Record<string, number> = {};
      regsRes.data?.forEach((r: any) => { regMap[r.event_id] = (regMap[r.event_id] || 0) + 1; });
      const topIds = Object.entries(regMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      let topEvts: TopEvent[] = [];
      if (topIds.length > 0) {
        const { data: evts } = await supabase.from('events').select('id, title').in('id', topIds.map(([id]) => id));
        if (evts) {
          topEvts = topIds.map(([id, count]) => ({
            id,
            title: evts.find((e) => e.id === id)?.title || 'Unknown',
            registrations: count,
          }));
        }
      }

      // 30-day chart
      const dayMap: Record<string, { registrations: number; revenue: number }> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10);
        dayMap[d] = { registrations: 0, revenue: 0 };
      }
      regsRecentRes.data?.forEach((r: any) => {
        const day = r.registered_at.slice(0, 10);
        if (dayMap[day]) dayMap[day].registrations++;
      });
      paymentsRes.data?.forEach((p: any) => {
        const day = p.processed_at.slice(0, 10);
        if (dayMap[day]) dayMap[day].revenue += typeof p.metadata?.amount === 'number' ? p.metadata.amount : 0;
      });

      setChartData(Object.entries(dayMap).map(([date, v]) => ({ date: date.slice(5), ...v })));
      setRecentPayments(recent);
      setTopEvents(topEvts);
      setStats({ totalEvents: eventsRes.count || 0, totalTickets: ticketsRes.count || 0, totalRevenue: revenue, totalUsers: usersRes.count || 0 });
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return <div className="text-muted-foreground">Loading...</div>;

  const cards = [
    { label: 'Total Events', value: stats.totalEvents, icon: CalendarDays, color: 'text-blue-400' },
    { label: 'Tickets Sold', value: stats.totalTickets, icon: Ticket, color: 'text-green-400' },
    { label: 'Total Revenue', value: `₦${stats.totalRevenue.toLocaleString()}`, icon: CreditCard, color: 'text-yellow-400' },
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Registrations & Revenue (Last 30 Days)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(222,84%,4.9%)', border: '1px solid hsl(217,33%,17.5%)', color: '#fff' }} />
                <Bar yAxisId="left" dataKey="registrations" fill="hsl(210, 80%, 60%)" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(45, 90%, 60%)" strokeWidth={2} dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Top Events by Registrations</CardTitle></CardHeader>
          <CardContent>
            {topEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No registrations yet.</p>
            ) : (
              <div className="space-y-3">
                {topEvents.map((e, i) => (
                  <div key={e.id} className="flex items-center justify-between">
                    <span className="text-sm"><span className="text-muted-foreground mr-2">#{i + 1}</span>{e.title}</span>
                    <span className="text-sm font-medium">{e.registrations}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Recent Transactions</CardTitle></CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm">{p.userName}</TableCell>
                      <TableCell className="capitalize text-sm">{p.type}</TableCell>
                      <TableCell className="text-sm">₦{p.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{p.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
