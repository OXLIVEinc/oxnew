/**
 * src/components/discover/DiscoverEventCard.tsx
 * -------------------------------------------------------------------------
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin } from 'lucide-react';
import { formatEventSchedule } from '@/lib/eventSchedule';
import type { EventSummary } from '@/lib/api/types';

interface Props {
  event: EventSummary;
}

function isEventLive(event: EventSummary): boolean {
  const now = Date.now();
  const target = new Date(`${event.schedule.date}T${event.schedule.time}`).getTime();
  return now >= target && now <= target + 1000 * 60 * 60;
}

export const DiscoverEventCard: React.FC<Props> = ({ event }) => {
  const navigate = useNavigate();
  const schedule = formatEventSchedule(event.schedule);
  const live = isEventLive(event);

  return (
    <div
      className="group cursor-pointer"
      onClick={() => navigate(`/event/${event.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/event/${event.id}`)}
    >
      <div className="relative overflow-hidden rounded-2xl">
        <div className="aspect-[4/5] bg-muted relative">
          <img
            src={event.backgroundImageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Top row: category + live/free badges */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {event.genre && (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-white/90 text-foreground px-2.5 py-1 rounded-full backdrop-blur-sm">
                  {event.genre}
                </span>
              )}
              {live && (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-red-600 text-white px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <span className="h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm shrink-0">
              <Heart size={14} className="text-foreground" />
            </span>
          </div>

          {/* Bottom: date chip */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            <span className="text-[11px] font-semibold bg-white/95 text-foreground px-2.5 py-1 rounded-full shadow-sm">
              {schedule.dateLabel}
            </span>
            <span className="text-[11px] font-medium bg-black/50 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
              {schedule.timeLabel}
            </span>
          </div>

          {!event.isPaid && (
            <span className="absolute bottom-3 right-3 text-[11px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-full shadow-sm">
              FREE
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-0.5">
        <h3 className="text-[15px] font-semibold text-foreground truncate leading-snug">{event.title}</h3>
        <p className="text-[13px] text-muted-foreground truncate flex items-center gap-1">
          <MapPin size={12} className="shrink-0" />
          {event.venue || event.address}
        </p>
        {event.registrationCount > 0 && (
          <p className="text-[12px] text-muted-foreground/80">
            {event.registrationCount} {event.registrationCount === 1 ? 'person' : 'people'} going
          </p>
        )}
      </div>
    </div>
  );
};
