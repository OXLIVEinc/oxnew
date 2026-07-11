import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Download, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TicketRow {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  eventTitle: string;
  eventId: string;
  tierName: string;
  tierPrice: number;
  checkInCode: string;
  checkedIn: boolean;
  createdAt: string;
}

export function AdminTicketsPanel() {
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [eventOptions, setEventOptions] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTickets = async () => {
    setLoading(true);
    const [ticketsRes, eventsRes, tiersRes] = await Promise.all([
      supabase.from('tickets').select('id, attendee_name, attendee_email, event_id, ticket_tier_id, check_in_code, checked_in, created_at'),
      supabase.from('events').select('id, title'),
      supabase.from('ticket_tiers').select('id, name, price'),
    ]);

    const eventMap: Record<string, string> = {};
    const evtList: { id: string; title: string }[] = [];
    eventsRes.data?.forEach((e: any) => { eventMap[e.id] = e.title; evtList.push({ id: e.id, title: e.title }); });
    setEventOptions(evtList);

    const tierMap: Record<string, { name: string; price: number }> = {};
    tiersRes.data?.forEach((t: any) => { tierMap[t.id] = { name: t.name, price: t.price }; });

    setTickets(
      (ticketsRes.data || []).map((t: any) => ({
        id: t.id,
        attendeeName: t.attendee_name || '—',
        attendeeEmail: t.attendee_email || '—',
        eventTitle: eventMap[t.event_id] || 'Unknown',
        eventId: t.event_id,
        tierName: t.ticket_tier_id ? (tierMap[t.ticket_tier_id]?.name || 'Unknown') : 'General',
        tierPrice: t.ticket_tier_id ? (tierMap[t.ticket_tier_id]?.price || 0) : 0,
        checkInCode: t.check_in_code || '—',
        checkedIn: t.checked_in,
        createdAt: new Date(t.created_at).toLocaleDateString(),
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

  const toggleCheckIn = async (id: string, current: boolean) => {
    const { error } = await supabase.from('tickets').update({
      checked_in: !current,
      checked_in_at: !current ? new Date().toISOString() : null,
    }).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else setTickets((prev) => prev.map((t) => t.id === id ? { ...t, checkedIn: !current } : t));
  };

  const cancelTicket = async (id: string) => {
    if (!confirm('Cancel this ticket? This will permanently delete it.')) return;
    const { error } = await supabase.from('tickets').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Ticket cancelled' }); setTickets((prev) => prev.filter(t => t.id !== id)); }
  };

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = t.attendeeName.toLowerCase().includes(q) ||
      t.attendeeEmail.toLowerCase().includes(q) ||
      t.checkInCode.toLowerCase().includes(q) ||
      t.eventTitle.toLowerCase().includes(q);
    const matchesEvent = eventFilter === 'all' || t.eventId === eventFilter;
    return matchesSearch && matchesEvent;
  });

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Event', 'Tier', 'Price', 'Check-in Code', 'Checked In', 'Date'];
    const rows = filtered.map((t) => [t.attendeeName, t.attendeeEmail, t.eventTitle, t.tierName, t.tierPrice, t.checkInCode, t.checkedIn ? 'Yes' : 'No', t.createdAt]);
    const csv = [headers, ...rows].map((r) => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tickets-${eventFilter === 'all' ? 'all' : eventFilter}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="text-muted-foreground">Loading tickets...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder="Search by name, email, event, or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={eventFilter} onValueChange={setEventFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filter by event" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            {eventOptions.map((e) => <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={exportCSV}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
        <span className="text-sm text-muted-foreground">{filtered.length} tickets</span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Checked In</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.attendeeName}</TableCell>
                <TableCell className="text-sm">{t.attendeeEmail}</TableCell>
                <TableCell className="text-sm max-w-[150px] truncate">{t.eventTitle}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{t.tierName}</Badge></TableCell>
                <TableCell className="text-right">₦{t.tierPrice.toLocaleString()}</TableCell>
                <TableCell className="font-mono text-xs">{t.checkInCode}</TableCell>
                <TableCell>
                  <Switch checked={t.checkedIn} onCheckedChange={() => toggleCheckIn(t.id, t.checkedIn)} />
                </TableCell>
                <TableCell className="text-sm">{t.createdAt}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => cancelTicket(t.id)} title="Cancel ticket">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No tickets found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
