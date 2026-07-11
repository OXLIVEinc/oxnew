import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useDiscoverFeed } from '@/hooks/api/useDiscover';
import { formatEventSchedule } from '@/lib/eventSchedule';
import type { DiscoverEvent } from '@/lib/api/types';

/**
 * src/components/EventMarketplace.tsx
 * -------------------------------------------------------------------------
 * "Trending Now" / "Best Events This Week" / "Daily Discovery" rows.
 * Previously these were faked client-side (an arbitrary slice, and a random
 * shuffle for "daily"). They're now backed by GET /api/discover, which
 * ranks trending by real likes + registrations, "this week" by events
 * actually starting in the next 7 days, and "daily" by events actually
 * starting today. See server/modules/discover/discover.service.ts.
 * -------------------------------------------------------------------------
 */
interface CategoryRow {
  title: string;
  subtitle?: string;
  events: DiscoverEvent[];
}

/* ── Horizontal scroll row with arrows ── */
const ScrollRow: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    ref.current?.scrollBy({ left: dir * 340, behavior: 'smooth' });
  };
  return (
    <div className="relative group/scroll">
      <button
        onClick={() => scroll(-1)}
        aria-label="Scroll left"
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex w-11 h-11 items-center justify-center bg-background border border-border/80 rounded-full shadow-lg shadow-black/5 opacity-0 group-hover/scroll:opacity-100 transition-all duration-200 hover:scale-105 hover:shadow-xl"
      >
        <ChevronLeft size={18} />
      </button>
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto px-4 md:px-8 pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ maskImage: 'linear-gradient(to right, transparent 0, black 24px, black calc(100% - 24px), transparent 100%)' }}
      >
        {children}
      </div>
      <button
        onClick={() => scroll(1)}
        aria-label="Scroll right"
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex w-11 h-11 items-center justify-center bg-background border border-border/80 rounded-full shadow-lg shadow-black/5 opacity-0 group-hover/scroll:opacity-100 transition-all duration-200 hover:scale-105 hover:shadow-xl"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
};

const PrimaryCard: React.FC<{ event: DiscoverEvent; onClick: () => void; isFirst?: boolean }> = ({ event, onClick }) => {
  const schedule = formatEventSchedule(event.schedule);
  return (
    <div onClick={onClick} className="flex-shrink-0 cursor-pointer group snap-start w-[82vw] sm:w-[60vw] md:w-[420px]">
      <div className="aspect-video overflow-hidden rounded-2xl bg-muted relative shadow-sm group-hover:shadow-xl transition-shadow duration-300">
        <img
          src={event.backgroundImageUrl}
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {!event.isPaid && (
          <span className="absolute top-3 right-3 text-[10px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-sm">
            FREE
          </span>
        )}
      </div>
      <div className="mt-2.5 px-0.5">
        <h4 className="text-sm font-semibold truncate text-foreground">{event.title}</h4>
        <p className="text-[12px] text-muted-foreground truncate mt-0.5">
          {schedule.dateLabel} · {event.address}
        </p>
      </div>
    </div>
  );
};

export const EventMarketplace: React.FC = () => {
  const navigate = useNavigate();
  const { data: feed, isLoading } = useDiscoverFeed();

  if (isLoading || !feed) return null;

  const rows: CategoryRow[] = [];
  if (feed.trending.length > 0) {
    rows.push({
      title: 'Trending Now',
      subtitle: 'Ranked by likes and registrations',
      events: feed.trending,
    });
  }
  if (feed.thisWeek.length > 0) {
    rows.push({
      title: 'Best Events This Week',
      subtitle: "Don't miss out on this week's hottest events",
      events: feed.thisWeek,
    });
  }
  if (feed.daily.length > 0) {
    rows.push({
      title: 'Daily Discovery',
      subtitle: 'Happening today',
      events: feed.daily,
    });
  }

  if (rows.length === 0) return null;

  const scrollToEvents = () => {
    document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-12 md:py-20 space-y-12 md:space-y-16">
      {rows.map((cat) => (
        <div key={cat.title}>
          <div className="flex items-end justify-between px-4 md:px-8 mb-1">
            <div>
              {cat.subtitle && (
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{cat.subtitle}</p>
              )}
              <h3 className="text-lg md:text-xl font-semibold">{cat.title}</h3>
            </div>
            <button
              onClick={scrollToEvents}
              className="text-[11px] uppercase font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 ml-4"
            >
              See All →
            </button>
          </div>
          <div className="mt-4">
            <ScrollRow>
              {cat.events.map((event, idx) => (
                <PrimaryCard
                  key={event.id}
                  event={event}
                  onClick={() => navigate(`/event/${event.id}`)}
                  isFirst={idx === 0}
                />
              ))}
            </ScrollRow>
          </div>
        </div>
      ))}
    </section>
  );
};
