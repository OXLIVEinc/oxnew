// src/components/discover/DiscoverEventCard.tsx
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
      <div className="relative overflow-hidden rounded-xl border border-border transition-all hover:shadow-md">
        {/* Image Section - Matching EventsPanel style */}
        <div className="aspect-video bg-muted overflow-hidden">
          <img
            src={event.backgroundImageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>

        <div className="p-4 space-y-2">
          {/* Title + Status / Live Badge */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm truncate leading-tight">{event.title}</h3>
            
            <div className="flex items-center gap-1 shrink-0">
              {live && (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-red-600 text-white px-2 py-0.5 rounded">
                  LIVE
                </span>
              )}
              {!event.isPaid && (
                <span className="text-[10px] font-semibold uppercase tracking-wide bg-emerald-500 text-white px-2 py-0.5 rounded">
                  FREE
                </span>
              )}
            </div>
          </div>

          {/* Date */}
          <p className="text-xs text-muted-foreground">{schedule.dateLabel} • {schedule.timeLabel}</p>

          {/* Location */}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin size={13} className="shrink-0" />
            {event.venue || event.address}
          </p>

          {/* Bottom row: Guests + Heart */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-muted-foreground">
              {event.registrationCount > 0 
                ? `${event.registrationCount} ${event.registrationCount === 1 ? 'person' : 'people'} going` 
                : 'No one going yet'}
            </span>

            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center hover:bg-accent transition-colors">
              <Heart size={14} className="text-foreground" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};