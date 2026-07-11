import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { format } from 'date-fns';

interface AnalyticsPanelProps {
  eventId: string | null;
}

interface EventOption {
  id: string;
  title: string;
}

interface DemographicData {
  genderCounts: Record<string, number>;
  locationCounts: Record<string, number>;
  registrationsOverTime: { date: string; count: number }[];
  totalGuests: number;
  checkedIn: number;
  revenue: number;
  tierBreakdown: { name: string; sold: number; revenue: number }[];
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ eventId: propEventId }) => {
  const { user } = useUserRole();
  const [events, setEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(propEventId);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [data, setData] = useState<DemographicData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user]);

  useEffect(() => {
    setSelectedEventId(propEventId);
  }, [propEventId]);

  useEffect(() => {
    if (selectedEventId && user) fetchAnalytics();
  }, [selectedEventId, dateFrom, dateTo, user]);

  const fetchEvents = async () => {
    if (!user) return;
    const { data: evts } = await supabase
      .from('events')
      .select('id, title')
      .eq('created_by', user.id)
      .order('target_date', { ascending: false });
    setEvents(evts || []);
  };

  const fetchAnalytics = async () => {
    if (!selectedEventId) return;
    setLoading(true);

    let query = supabase
      .from('event_registrations')
      .select('user_id, registered_at')
      .eq('event_id', selectedEventId);

    if (dateFrom) query = query.gte('registered_at', new Date(dateFrom).toISOString());
    if (dateTo) query = query.lte('registered_at', new Date(dateTo + 'T23:59:59').toISOString());

    const { data: regs } = await query;

    if (!regs || regs.length === 0) {
      setData({ genderCounts: {}, locationCounts: {}, registrationsOverTime: [], totalGuests: 0, checkedIn: 0, revenue: 0, tierBreakdown: [] });
      setLoading(false);
      return;
    }

    const userIds = regs.map(r => r.user_id);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, gender, location_country')
      .in('user_id', userIds);

    const { data: tickets } = await supabase
      .from('tickets')
      .select('user_id, checked_in, ticket_tier_id')
      .eq('event_id', selectedEventId);

    // Ticket tier data
    const { data: tiers } = await supabase
      .from('ticket_tiers')
      .select('id, name, price, sold')
      .eq('event_id', selectedEventId);

    const genderCounts: Record<string, number> = {};
    profiles?.forEach(p => {
      const g = p.gender || 'Not specified';
      genderCounts[g] = (genderCounts[g] || 0) + 1;
    });

    const locationCounts: Record<string, number> = {};
    profiles?.forEach(p => {
      const l = p.location_country || 'Not specified';
      locationCounts[l] = (locationCounts[l] || 0) + 1;
    });

    const dateMap: Record<string, number> = {};
    regs.forEach(r => {
      const d = new Date(r.registered_at).toLocaleDateString();
      dateMap[d] = (dateMap[d] || 0) + 1;
    });
    const registrationsOverTime = Object.entries(dateMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const checkedIn = tickets?.filter(t => t.checked_in).length || 0;

    const tierBreakdown = (tiers || []).map(t => ({
      name: t.name,
      sold: t.sold,
      revenue: t.sold * t.price,
    }));
    const revenue = tierBreakdown.reduce((sum, t) => sum + t.revenue, 0);

    setData({
      genderCounts,
      locationCounts,
      registrationsOverTime,
      totalGuests: regs.length,
      checkedIn,
      revenue,
      tierBreakdown,
    });
    setLoading(false);
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
      </div>

      {!selectedEventId ? (
        <div className="py-12 text-center text-muted-foreground">Select an event to view analytics</div>
      ) : loading ? (
        <div className="py-12 text-center">Loading analytics...</div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Guests', value: data.totalGuests },
              { label: 'Checked In', value: data.checkedIn },
              { label: 'Attendance Rate', value: `${data.totalGuests > 0 ? Math.round((data.checkedIn / data.totalGuests) * 100) : 0}%` },
              { label: 'Revenue', value: `$${data.revenue.toLocaleString()}` },
              { label: 'Locations', value: Object.keys(data.locationCounts).length },
            ].map((card, i) => (
              <div key={i} className="border border-border p-4">
                <div className="text-[11px] uppercase text-muted-foreground mb-1">{card.label}</div>
                <div className="text-2xl font-medium">{card.value}</div>
              </div>
            ))}
          </div>

          {/* Tier Breakdown */}
          {data.tierBreakdown.length > 0 && (
            <div className="border border-border p-6">
              <h3 className="text-sm font-medium uppercase mb-4">Ticket Tier Breakdown</h3>
              {data.tierBreakdown.map((tier, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-muted last:border-0">
                  <span className="text-sm">{tier.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm">{tier.sold} sold</span>
                    <span className="text-sm font-medium">${tier.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Registrations Over Time */}
          <div className="border border-border p-6">
            <h3 className="text-sm font-medium uppercase mb-4">Registrations Over Time</h3>
            {data.registrationsOverTime.length === 0 ? (
              <p className="text-muted-foreground text-sm">No registration data yet</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {data.registrationsOverTime.map((item, i) => {
                  const maxReg = Math.max(...data.registrationsOverTime.map(r => r.count), 1);
                  return (
                    <div key={i} className="flex flex-col items-center flex-1">
                      <div className="text-[10px] mb-1">{item.count}</div>
                      <div className="w-full bg-[#FA76FF] min-h-[4px]" style={{ height: `${(item.count / maxReg) * 100}%` }} />
                      <div className="text-[9px] mt-1 text-muted-foreground truncate w-full text-center">{item.date}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-border p-6">
              <h3 className="text-sm font-medium uppercase mb-4">Gender Distribution</h3>
              {Object.entries(data.genderCounts).map(([gender, count]) => (
                <div key={gender} className="flex items-center justify-between py-2 border-b border-muted last:border-0">
                  <span className="text-sm">{gender}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted h-2">
                      <div className="bg-foreground h-2" style={{ width: `${(count / data.totalGuests) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="border border-border p-6">
              <h3 className="text-sm font-medium uppercase mb-4">Location Distribution</h3>
              {Object.entries(data.locationCounts).map(([loc, count]) => (
                <div key={loc} className="flex items-center justify-between py-2 border-b border-muted last:border-0">
                  <span className="text-sm">{loc}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted h-2">
                      <div className="bg-foreground h-2" style={{ width: `${(count / data.totalGuests) * 100}%` }} />
                    </div>
                    <span className="text-sm font-medium">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
