import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Event {
  id: string;
  title: string;
  background_image_url: string;
  address: string;
  date: string;
  time: string;
  target_date: string;
}

export const EventsCarousel = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .select('id, title, background_image_url, address, date, time, target_date')
        .eq('status', 'active')
        .gte('target_date', now)
        .order('target_date', { ascending: true })
        .limit(10);

      if (data && !error) setEvents(data);
    };
    fetchEvents();
  }, []);

  if (events.length === 0) return null;

  return (
    <div className="w-full py-8 md:py-12 bg-background">
      <div className="flex items-center justify-between px-4 md:px-8 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-medium">Featured Events</h2>
        <button
          onClick={() => document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-[11px] uppercase font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          View All →
        </button>
      </div>
      <div className="flex gap-3 md:gap-4 overflow-x-auto px-4 md:px-8 pb-4 snap-x snap-mandatory scrollbar-hide">
        {events.map((event, index) => (
          <div
            key={event.id}
            onClick={() => navigate(`/event/${event.id}`)}
            className="relative flex-shrink-0 w-[70vw] md:w-[35vw] lg:w-[28vw] aspect-video cursor-pointer overflow-hidden snap-start animate-fade-in group"
            style={{ animationDelay: `${index * 0.08}s`, animationFillMode: 'both' }}
          >
            <img
              src={event.background_image_url}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            
            <div className="absolute top-3 left-3 flex flex-col gap-0">
              <div className="bg-background border border-foreground px-2.5 h-[22px] flex items-center">
                <span className="text-[10px] font-medium uppercase leading-none">{event.date}</span>
              </div>
              <div className="bg-background border border-t-0 border-foreground px-2.5 h-[22px] flex items-center">
                <span className="text-[10px] font-medium uppercase leading-none">{event.time}</span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 text-white">
              <h3 className="text-lg md:text-xl font-medium mb-1 tracking-tight">{event.title}</h3>
              <p className="text-xs md:text-sm text-white/80 truncate">{event.address}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};