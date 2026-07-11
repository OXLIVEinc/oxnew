import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, Star, StarOff, Ban } from 'lucide-react';

interface EventRow {
  id: string;
  title: string;
  creator: string;
  createdBy: string;
  date: string;
  address: string;
  status: string;
  ticketsSold: number;
  revenue: number;
  isFeatured: boolean;
}

export function AdminEventsPanel() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchEvents = async () => {
    setLoading(true);
    const [eventsRes, ticketsRes, paymentsRes, tiersRes] = await Promise.all([
      supabase.from('events').select('id, title, creator, created_by, date, address, status, tags'),
      supabase.from('tickets').select('event_id, ticket_tier_id'),
      supabase.from('processed_payments').select('metadata').eq('payment_type', 'ticket'),
      supabase.from('ticket_tiers').select('id, event_id, price'),
    ]);

    const ticketCountMap: Record<string, number> = {};
    ticketsRes.data?.forEach((t: any) => {
      ticketCountMap[t.event_id] = (ticketCountMap[t.event_id] || 0) + 1;
    });

    // Build tier price map for revenue estimation
    const tierPriceMap: Record<string, number> = {};
    tiersRes.data?.forEach((t: any) => { tierPriceMap[t.id] = t.price; });

    // Estimate revenue per event from tickets
    const eventRevenueMap: Record<string, number> = {};
    ticketsRes.data?.forEach((t: any) => {
      const price = t.ticket_tier_id ? (tierPriceMap[t.ticket_tier_id] || 0) : 0;
      eventRevenueMap[t.event_id] = (eventRevenueMap[t.event_id] || 0) + price;
    });

    setEvents(
      (eventsRes.data || []).map((e: any) => ({
        id: e.id,
        title: e.title,
        creator: e.creator,
        createdBy: e.created_by,
        date: e.date,
        address: e.address,
        status: e.status,
        ticketsSold: ticketCountMap[e.id] || 0,
        revenue: eventRevenueMap[e.id] || 0,
        isFeatured: e.tags?.includes('featured') || false,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('events').update({ status }).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Status updated' }); fetchEvents(); }
  };

  const toggleFeatured = async (id: string, currentTags: boolean) => {
    const event = events.find(e => e.id === id);
    if (!event) return;
    const { data } = await supabase.from('events').select('tags').eq('id', id).single();
    let tags: string[] = data?.tags || [];
    if (currentTags) {
      tags = tags.filter(t => t !== 'featured');
    } else {
      tags = [...tags, 'featured'];
    }
    const { error } = await supabase.from('events').update({ tags }).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: currentTags ? 'Unfeatured' : 'Featured' }); fetchEvents(); }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event permanently? This will also remove all associated tickets and registrations.')) return;
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Event deleted' }); fetchEvents(); }
  };

  const filtered = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.creator.toLowerCase().includes(search.toLowerCase()) ||
      e.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      sold_out: 'bg-red-500/20 text-red-400 border-red-500/30',
      ended: 'bg-muted text-muted-foreground border-muted',
    };
    return <Badge variant="outline" className={colors[status] || ''}>{status.replace('_', ' ')}</Badge>;
  };

  if (loading) return <div className="text-muted-foreground">Loading events...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder="Search by title, organizer, or venue..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sold_out">Sold Out</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{filtered.length} events</span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Organizer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Tickets</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/event/${e.id}`)}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {e.isFeatured && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
                    {e.title}
                  </div>
                </TableCell>
                <TableCell>{e.creator}</TableCell>
                <TableCell className="whitespace-nowrap">{e.date}</TableCell>
                <TableCell className="max-w-[180px] truncate">{e.address}</TableCell>
                <TableCell onClick={(ev) => ev.stopPropagation()}>
                  <Select value={e.status} onValueChange={(v) => updateStatus(e.id, v)}>
                    <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sold_out">Sold Out</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">{e.ticketsSold}</TableCell>
                <TableCell className="text-right">₦{e.revenue.toLocaleString()}</TableCell>
                <TableCell onClick={(ev) => ev.stopPropagation()}>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => toggleFeatured(e.id, e.isFeatured)} title={e.isFeatured ? 'Unfeature' : 'Feature'}>
                      {e.isFeatured ? <StarOff className="h-4 w-4 text-yellow-400" /> : <Star className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteEvent(e.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No events found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
