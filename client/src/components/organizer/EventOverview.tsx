import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';

interface EventWithCounts {
  id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  background_image_url: string;
  target_date: string;
  guest_count: number;
}

interface EventOverviewProps {
  onSelectEvent: (id: string | null) => void;
  selectedEventId: string | null;
}

export const EventOverview: React.FC<EventOverviewProps> = ({ onSelectEvent, selectedEventId }) => {
  const { user } = useUserRole();
  const [events, setEvents] = useState<EventWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);

     console.log('sshshs')
    const { data: eventsData, error } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', user.id)
      .order('target_date', { ascending: false });

      console.log(eventsData,'jelell')

    if (error || !eventsData) {
      setLoading(false);
      return;
    }

    const eventIds = eventsData.map(e => e.id);
    const { data: regs } = await supabase
      .from('event_registrations')
      .select('event_id')
      .in('event_id', eventIds);

    const countMap: Record<string, number> = {};
    regs?.forEach(r => { countMap[r.event_id] = (countMap[r.event_id] || 0) + 1; });

    const eventsWithCounts = eventsData.map(e => ({
      ...e,
      guest_count: countMap[e.id] || 0,
    }));

    setEvents(eventsWithCounts);
    if (!selectedEventId && eventsWithCounts.length > 0) {
      onSelectEvent(eventsWithCounts[0].id);
    }
    setLoading(false);
  };

  const updateStatus = async (eventId: string, status: string) => {
    await supabase.from('events').update({ status }).eq('id', eventId);
    fetchEvents();
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    draft: 'bg-blue-100 text-blue-800',
    soldout: 'bg-red-100 text-red-800',
    postponed: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-gray-100 text-gray-800',
  };

  if (loading) return <div className="py-12 text-center">Loading events...</div>;

  if (events.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500 mb-4">No events yet</p>
        <button
          onClick={() => navigate('/create-event')}
          className="bg-[#1A1A1A] text-white px-6 py-3 text-sm uppercase font-medium hover:bg-[#FA76FF] hover:text-black transition-colors"
        >
          Create Event
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {events.map((event) => (
        <div
          key={event.id}
          className={`border cursor-pointer transition-all group ${
            selectedEventId === event.id ? 'border-[#FA76FF] border-2' : 'border-black'
          }`}
        >
          <div
            className="aspect-video bg-muted relative overflow-hidden"
            onClick={() => onSelectEvent(event.id)}
          >
            <img
              src={event.background_image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Edit button overlay */}
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/event/${event.id}/edit`); }}
              className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm border border-black px-3 py-1.5 text-[11px] uppercase font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#FA76FF] hover:border-[#FA76FF]"
            >
              Edit
            </button>
          </div>
          <div className="p-4" onClick={() => onSelectEvent(event.id)}>
            <h3 className="font-medium text-lg mb-2">{event.title}</h3>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] uppercase border border-black px-2 py-1">{event.date}</span>
              <span className={`text-[11px] uppercase px-2 py-1 ${statusColors[event.status] || statusColors.active}`}>
                {event.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{event.guest_count} guests</span>
              <div className="w-32 bg-gray-200 h-2">
                <div
                  className="bg-[#FA76FF] h-2 transition-all"
                  style={{ width: `${Math.min((event.guest_count / 100) * 100, 100)}%` }}
                />
              </div>
            </div>
            <select
              value={event.status}
              onChange={(e) => { e.stopPropagation(); updateStatus(event.id, e.target.value); }}
              onClick={(e) => e.stopPropagation()}
              className="mt-3 w-full border border-black px-3 py-2 text-[11px] uppercase bg-white focus:outline-none"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="soldout">Sold Out</option>
              <option value="postponed">Postponed</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
};
