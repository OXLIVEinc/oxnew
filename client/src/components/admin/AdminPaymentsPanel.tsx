import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface PaymentRow {
  id: string;
  reference: string;
  userName: string;
  paymentType: string;
  amount: number;
  date: string;
  eventName: string;
}

interface EventRevenue {
  eventId: string;
  eventTitle: string;
  revenue: number;
  ticketCount: number;
}

export function AdminPaymentsPanel() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [ticketRevenue, setTicketRevenue] = useState(0);
  const [subRevenue, setSubRevenue] = useState(0);
  const [eventRevenues, setEventRevenues] = useState<EventRevenue[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [paymentsRes, profilesRes, eventsRes, ticketsRes, tiersRes] = await Promise.all([
        supabase.from('processed_payments').select('*').order('processed_at', { ascending: false }),
        supabase.from('profiles').select('user_id, display_name'),
        supabase.from('events').select('id, title'),
        supabase.from('tickets').select('event_id, ticket_tier_id'),
        supabase.from('ticket_tiers').select('id, event_id, price'),
      ]);

      const profileMap: Record<string, string> = {};
      profilesRes.data?.forEach((p: any) => { profileMap[p.user_id] = p.display_name || 'Unknown'; });

      const eventMap: Record<string, string> = {};
      eventsRes.data?.forEach((e: any) => { eventMap[e.id] = e.title; });

      let ticketRev = 0;
      let subRev = 0;

      const rows = (paymentsRes.data || []).map((p: any) => {
        const amt = typeof p.metadata?.amount === 'number' ? p.metadata.amount : 0;
        const eventId = p.metadata?.event_id;
        if (p.payment_type === 'ticket') ticketRev += amt;
        else if (p.payment_type === 'subscription') subRev += amt;

        return {
          id: p.id,
          reference: p.reference,
          userName: profileMap[p.user_id] || 'Unknown',
          paymentType: p.payment_type,
          amount: amt,
          date: new Date(p.processed_at).toLocaleDateString(),
          eventName: eventId ? (eventMap[eventId] || '—') : '—',
        };
      });

      // Revenue per event
      const tierPriceMap: Record<string, number> = {};
      const tierEventMap: Record<string, string> = {};
      tiersRes.data?.forEach((t: any) => { tierPriceMap[t.id] = t.price; tierEventMap[t.id] = t.event_id; });

      const evtRevMap: Record<string, { revenue: number; count: number }> = {};
      ticketsRes.data?.forEach((t: any) => {
        const price = t.ticket_tier_id ? (tierPriceMap[t.ticket_tier_id] || 0) : 0;
        const evtId = t.event_id;
        if (!evtRevMap[evtId]) evtRevMap[evtId] = { revenue: 0, count: 0 };
        evtRevMap[evtId].revenue += price;
        evtRevMap[evtId].count++;
      });

      const evtRevList = Object.entries(evtRevMap)
        .map(([eventId, v]) => ({ eventId, eventTitle: eventMap[eventId] || 'Unknown', revenue: v.revenue, ticketCount: v.count }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setPayments(rows);
      setTicketRevenue(ticketRev);
      setSubRevenue(subRev);
      setEventRevenues(evtRevList);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    return p.userName.toLowerCase().includes(q) || p.reference.toLowerCase().includes(q);
  });

  if (loading) return <div className="text-muted-foreground">Loading payments...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">₦{(ticketRevenue + subRevenue).toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Ticket Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-400">₦{ticketRevenue.toLocaleString()}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Subscription Revenue</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-purple-400">₦{subRevenue.toLocaleString()}</div></CardContent>
        </Card>
      </div>

      {eventRevenues.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Revenue by Event (Top 10)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventRevenues.map((e) => (
                <div key={e.eventId} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium">{e.eventTitle}</span>
                    <span className="text-xs text-muted-foreground ml-2">({e.ticketCount} tickets)</span>
                  </div>
                  <span className="text-sm font-bold">₦{e.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <Input placeholder="Search by name or reference..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Event</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.reference}</TableCell>
                  <TableCell>{p.userName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={p.paymentType === 'ticket' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}>
                      {p.paymentType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{p.eventName}</TableCell>
                  <TableCell className="text-right font-medium">
                    {p.amount === 0 ? (
                      <span className="text-yellow-400">₦0 ⚠</span>
                    ) : (
                      `₦${p.amount.toLocaleString()}`
                    )}
                  </TableCell>
                  <TableCell>{p.date}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No payments found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
