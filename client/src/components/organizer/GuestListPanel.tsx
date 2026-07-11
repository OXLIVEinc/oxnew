import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Download, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Guest {
  user_id: string;
  registered_at: string;
  display_name: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  location_country: string | null;
  checked_in: boolean;
  ticket_tier_name: string | null;
  attendee_name: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
  check_in_code: string | null;
}

interface EventOption {
  id: string;
  title: string;
}

interface GuestListPanelProps {
  eventId: string | null;
}

export const GuestListPanel: React.FC<GuestListPanelProps> = ({ eventId: propEventId }) => {
  const { user } = useUserRole();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(propEventId);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkedInFilter, setCheckedInFilter] = useState<'all' | 'yes' | 'no'>('all');

  useEffect(() => {
    if (user) fetchEvents();
  }, [user]);

  useEffect(() => {
    setSelectedEventId(propEventId);
  }, [propEventId]);

  useEffect(() => {
    if (selectedEventId) fetchGuests();
  }, [selectedEventId, dateFrom, dateTo]);

  const fetchEvents = async () => {
    if (!user) return;
    const { data: evts } = await supabase
      .from('events')
      .select('id, title')
      .eq('created_by', user.id)
      .order('target_date', { ascending: false });
    setEvents(evts || []);
  };

  const fetchGuests = async () => {
    if (!selectedEventId) return;
    setLoading(true);

    let regQuery = supabase
      .from('event_registrations')
      .select('user_id, registered_at')
      .eq('event_id', selectedEventId);

    if (dateFrom) regQuery = regQuery.gte('registered_at', new Date(dateFrom).toISOString());
    if (dateTo) regQuery = regQuery.lte('registered_at', new Date(dateTo + 'T23:59:59').toISOString());

    const { data: regs } = await regQuery;

    if (!regs || regs.length === 0) {
      setGuests([]);
      setLoading(false);
      return;
    }

    const userIds = regs.map(r => r.user_id);
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, phone, gender, location_country')
      .in('user_id', userIds);

    const { data: tickets } = await supabase
      .from('tickets')
      .select('user_id, checked_in, ticket_tier_id, attendee_name, attendee_email, attendee_phone, check_in_code')
      .eq('event_id', selectedEventId)
      .in('user_id', userIds);

    // Get tier names
    const { data: tiers } = await supabase
      .from('ticket_tiers')
      .select('id, name')
      .eq('event_id', selectedEventId);
    const tierMap = new Map(tiers?.map(t => [t.id, t.name]));

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

    // Build guest list from tickets (each ticket = 1 guest entry)
    const guestList: Guest[] = [];
    const processedUsers = new Set<string>();

    tickets?.forEach(t => {
      const profile = profileMap.get(t.user_id);
      const reg = regs.find(r => r.user_id === t.user_id);
      guestList.push({
        user_id: t.user_id,
        registered_at: reg?.registered_at || '',
        display_name: t.attendee_name || profile?.display_name || null,
        email: t.attendee_email || '',
        phone: t.attendee_phone || profile?.phone || null,
        gender: profile?.gender || null,
        location_country: profile?.location_country || null,
        checked_in: t.checked_in,
        ticket_tier_name: t.ticket_tier_id ? tierMap.get(t.ticket_tier_id) || null : null,
        attendee_name: t.attendee_name,
        attendee_email: t.attendee_email,
        attendee_phone: t.attendee_phone,
        check_in_code: (t as any).check_in_code || null,
      });
    });

    // Add users who registered but have no tickets
    regs.forEach(r => {
      if (!tickets?.some(t => t.user_id === r.user_id)) {
        const profile = profileMap.get(r.user_id);
        guestList.push({
          user_id: r.user_id,
          registered_at: r.registered_at,
          display_name: profile?.display_name || null,
          email: '',
          phone: profile?.phone || null,
          gender: profile?.gender || null,
          location_country: profile?.location_country || null,
          checked_in: false,
          ticket_tier_name: null,
          attendee_name: null,
          attendee_email: null,
          attendee_phone: null,
          check_in_code: null,
        });
      }
    });

    setGuests(guestList);
    setLoading(false);
  };

  const filteredGuests = guests.filter(g => {
    if (checkedInFilter === 'yes') return g.checked_in;
    if (checkedInFilter === 'no') return !g.checked_in;
    return true;
  });

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Ticket', 'Check-In Code', 'Gender', 'Location', 'Registered At', 'Checked In'];
    const rows = filteredGuests.map(g => [
      g.display_name || 'N/A',
      g.attendee_email || g.email || 'N/A',
      g.attendee_phone || g.phone || 'N/A',
      g.ticket_tier_name || 'General',
      g.check_in_code || 'N/A',
      g.gender || 'N/A',
      g.location_country || 'N/A',
      g.registered_at ? new Date(g.registered_at).toLocaleString() : 'N/A',
      g.checked_in ? 'Yes' : 'No',
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guest-list-${selectedEventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[11px] uppercase font-medium text-muted-foreground block mb-1">Event</label>
          <select
            value={selectedEventId || ''}
            onChange={(e) => setSelectedEventId(e.target.value || null)}
            className="w-full border border-border px-3 py-2.5 text-sm bg-background focus:outline-none"
          >
            <option value="">Select an event</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] uppercase font-medium text-muted-foreground block mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-border px-3 py-2.5 text-sm bg-background focus:outline-none" />
        </div>
        <div>
          <label className="text-[11px] uppercase font-medium text-muted-foreground block mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-border px-3 py-2.5 text-sm bg-background focus:outline-none" />
        </div>
        <div>
          <label className="text-[11px] uppercase font-medium text-muted-foreground block mb-1">Status</label>
          <select
            value={checkedInFilter}
            onChange={(e) => setCheckedInFilter(e.target.value as any)}
            className="border border-border px-3 py-2.5 text-sm bg-background focus:outline-none"
          >
            <option value="all">All</option>
            <option value="yes">Checked In</option>
            <option value="no">Not Checked In</option>
          </select>
        </div>
      </div>

      {!selectedEventId ? (
        <div className="py-12 text-center text-muted-foreground">Select an event to view guest list</div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">Guest List ({filteredGuests.length})</h2>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2 text-[11px] uppercase font-medium hover:opacity-90 transition-opacity"
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center">Loading guests...</div>
          ) : filteredGuests.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No guests found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-border">
                <thead>
                  <tr className="bg-foreground text-background">
                    <th className="text-left px-4 py-3 text-[11px] uppercase font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase font-medium">Phone</th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase font-medium">Ticket</th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase font-medium">Check-In Code</th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase font-medium">Registered</th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-[11px] uppercase font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest, i) => (
                    <tr key={`${guest.user_id}-${i}`} className="border-t border-border hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">{guest.display_name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{guest.attendee_email || guest.email || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{guest.attendee_phone || guest.phone || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{guest.ticket_tier_name || 'General'}</td>
                      <td className="px-4 py-3 text-sm font-mono font-bold">{guest.check_in_code || '—'}</td>
                      <td className="px-4 py-3 text-sm">{guest.registered_at ? new Date(guest.registered_at).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 text-[11px] uppercase ${
                          guest.checked_in 
                            ? 'bg-green-100 text-green-800 line-through opacity-60' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {guest.checked_in ? '✓ Checked In' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={async () => {
                            if (!selectedEventId) return;
                            if (!confirm('Delete this guest\'s ticket? This cannot be undone.')) return;
                            try {
                              // First delete registrations (no trigger will fire on DELETE)
                              const { error: regError } = await supabase
                                .from('event_registrations')
                                .delete()
                                .eq('event_id', selectedEventId)
                                .eq('user_id', guest.user_id);
                              if (regError) throw regError;

                              // Then delete all tickets for this user+event
                              const { error: ticketError } = await supabase
                                .from('tickets')
                                .delete()
                                .eq('event_id', selectedEventId)
                                .eq('user_id', guest.user_id);
                              if (ticketError) throw ticketError;

                              // Update local state immediately to avoid stale data
                              setGuests(prev => prev.filter(g => g.user_id !== guest.user_id));
                              toast({ title: 'Guest removed', description: 'Ticket and registration deleted.' });
                            } catch (err: any) {
                              toast({ title: 'Error', description: err.message, variant: 'destructive' });
                              // Refresh to show actual state
                              fetchGuests();
                            }
                          }}
                          className="text-destructive hover:text-destructive/80 p-1"
                          title="Delete ticket"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};
