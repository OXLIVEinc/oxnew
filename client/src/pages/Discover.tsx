import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/SEOHead';
import { FeaturedStoriesCarousel } from '@/components/FeaturedStoriesCarousel';
import { TrustedByMarquee } from '@/components/TrustedByMarquee';
import { EventMarketplace } from '@/components/EventMarketplace';
import { useGeoLocation } from '@/hooks/useGeoLocation';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  background_image_url: string;
  target_date: string;
  address: string;
}

const TYPEWRITER_PHRASES = [
  'Built to Empower Events.',
  'Where Every Moment Counts.',
  'Your Events, Amplified.',
];

const TypewriterText: React.FC = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    const phrase = TYPEWRITER_PHRASES[phraseIndex];
    const speed = deleting ? 30 : 60;
    const pauseEnd = 2000;

    const timer = setTimeout(() => {
      if (!deleting && charIndex < phrase.length) {
        setDisplayText(phrase.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      } else if (!deleting && charIndex === phrase.length) {
        setTimeout(() => setDeleting(true), pauseEnd);
      } else if (deleting && charIndex > 0) {
        setDisplayText(phrase.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      } else if (deleting && charIndex === 0) {
        setDeleting(false);
        setPhraseIndex((phraseIndex + 1) % TYPEWRITER_PHRASES.length);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, deleting, phraseIndex]);

  return (
    <span>
      {displayText}
      <span className="inline-block w-[2px] h-[1em] bg-foreground ml-0.5 animate-pulse align-middle" />
    </span>
  );
};

const EventCard = ({ event }: { event: Event }) => {
  const navigate = useNavigate();
  const isEventLive = () => {
    const now = new Date().getTime();
    const target = new Date(event.target_date).getTime();
    const oneHour = 1000 * 60 * 60;
    return now >= target && now <= target + oneHour;
  };
  const eventLive = isEventLive();
  return (
    <div className="relative cursor-pointer group" onClick={() => navigate(`/event/${event.id}`)}>
      <div className="overflow-hidden rounded-lg mb-3">
        <div className="aspect-video bg-muted relative">
          <img
            src={event.background_image_url}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex gap-0 mb-2">
              <span className="text-[10px] uppercase bg-white text-black px-2 py-0.5 font-medium">{event.date}</span>
              <span className="text-[10px] uppercase border border-white text-white px-2 py-0.5">{event.time}</span>
              {eventLive && (
                <span className="text-[10px] uppercase border text-white px-2 py-0.5 bg-red-600 border-red-600">LIVE</span>
              )}
            </div>
            <h3 className="text-white text-base font-medium truncate">{event.title}</h3>
            <p className="text-white/70 text-xs truncate mt-0.5">{event.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Discover = () => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialDateSet, setInitialDateSet] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const geo = useGeoLocation();

  useEffect(() => {
    fetchEvents();
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!initialDateSet && events.length > 0) {
      const today = new Date();
      const now = today.getTime();
      const oneHour = 1000 * 60 * 60;
      const hasEventsToday = events.some((event) => {
        const eventDate = new Date(event.target_date);
        const target = eventDate.getTime();
        if (target < now - oneHour) return false;
        return eventDate.getFullYear() === today.getFullYear() && eventDate.getMonth() === today.getMonth() && eventDate.getDate() === today.getDate();
      });
      if (hasEventsToday) setDate(today);
      setInitialDateSet(true);
    }
  }, [events, initialDateSet]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, date, time, background_image_url, target_date, address')
        .eq('status', 'active')
        .order('target_date', { ascending: true });
      if (error) throw error;
      setEvents(data || []);
    } catch { /* */ } finally { setLoading(false); }
  };

  const filteredEvents = events.filter((event) => {
    const now = new Date().getTime();
    const target = new Date(event.target_date).getTime();
    const oneHour = 1000 * 60 * 60;
    if (target < now - oneHour) return false;
    if (!date) return true;
    const eventDate = new Date(event.target_date);
    return eventDate.getFullYear() === date.getFullYear() && eventDate.getMonth() === date.getMonth() && eventDate.getDate() === date.getDate();
  });

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead title="Discover Events | OX Entertainment" description="Explore popular events near you" keywords="events, discover events, community events, OX Entertainment" />
      <div className="animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <Navbar />
      </div>

      {/* Hero Section */}
      <section className="pt-32 md:pt-40 lg:pt-48 pb-6 md:pb-16 lg:pb-24 px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ transform: `translate3d(0, ${scrollY * 0.5}px, 0)` }}>
          <div className="absolute top-10 left-[5%] w-48 md:w-96 h-48 md:h-96 rounded-full bg-[hsl(var(--primary))]/[0.04] blur-3xl" />
          <div className="absolute top-32 right-[10%] w-64 md:w-[500px] h-64 md:h-[500px] rounded-full bg-[hsl(300,100%,73%)]/[0.04] blur-3xl" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-10" />

        <div
          className="max-w-4xl mx-auto text-center relative z-20"
          style={{ transform: `translate3d(0, ${scrollY * -0.15}px, 0)`, opacity: Math.max(0, 1 - scrollY / 700) }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium mb-6 md:mb-10 inline-flex flex-col items-center">
            <div className="flex gap-2 items-center">
              <span className="border border-foreground px-3 md:px-6 py-2 md:py-4 animate-fade-in" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>Discover</span>
              <span className="bg-[hsl(300,100%,73%)] text-foreground border border-foreground px-3 md:px-6 py-2 md:py-4 rounded-[20px] md:rounded-[40px] -ml-px animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>events</span>
            </div>
            <div className="flex items-center -mt-px">
              <span className="border border-foreground px-3 md:px-6 py-2 md:py-4 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>near</span>
              <span className="border border-l-0 border-foreground px-3 md:px-6 py-2 md:py-4 animate-fade-in" style={{ animationDelay: '0.6s', animationFillMode: 'both' }}>you</span>
            </div>
          </h1>
          <p className="text-sm md:text-base lg:text-[18px] text-foreground/80 max-w-2xl mx-auto h-7 animate-fade-in" style={{ animationDelay: '0.7s', animationFillMode: 'both' }}>
            <TypewriterText />
          </p>
        </div>
      </section>

      {/* Trusted By Marquee */}
      <div style={{ transform: `translate3d(0, ${Math.max(0, scrollY - 200) * -0.03}px, 0)` }}>
        <TrustedByMarquee />
      </div>

      {/* Featured Events - Instagram Stories format */}
      <div style={{ transform: `translate3d(0, ${Math.max(0, scrollY - 400) * -0.05}px, 0)` }}>
        <FeaturedStoriesCarousel />
      </div>

      {/* Event Marketplace */}
      <div style={{ transform: `translate3d(0, ${Math.max(0, scrollY - 800) * -0.03}px, 0)` }}>
        <EventMarketplace />
      </div>

      {/* Browse by Date Section */}
      <section id="events-section" className="px-4 md:px-8 pb-16 pt-6 md:pt-16">
        <div>
          <div className="flex flex-wrap items-center gap-0 mb-6 md:mb-8 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
            <h2 className="text-base md:text-lg lg:text-xl font-normal w-full sm:w-auto mb-2 sm:mb-0">Browsing events in</h2>
            <span className="text-base md:text-lg lg:text-xl font-normal border border-foreground px-2 py-1 sm:ml-2">{geo.country}</span>
            <div className="lg:hidden">
              <Popover>
                <PopoverTrigger asChild>
                  <button className={cn("text-base md:text-lg lg:text-xl font-normal border border-l-0 border-foreground px-2 py-1 flex items-center bg-background hover:bg-muted transition-colors", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM do, yyyy") : <span>Pick a date</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-12 mt-8 md:mt-16">
            <div className="hidden lg:block animate-fade-in lg:sticky lg:top-24 self-start" style={{ animationDelay: '0.9s', animationFillMode: 'both' }}>
              <Calendar mode="single" selected={date} onSelect={setDate} className="mx-auto" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:col-start-2 gap-3 md:gap-5">
              {loading ? (
                <div className="col-span-full text-center py-12">Loading events...</div>
              ) : filteredEvents.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  {date ? `No events found for ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}` : 'No events found'}
                </div>
              ) : (
                filteredEvents.map((event, index) => (
                  <div key={event.id} className="animate-fade-in" style={{ animationDelay: `${1.0 + (index * 0.05)}s`, animationFillMode: 'both' }}>
                    <EventCard event={event} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Discover;