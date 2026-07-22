import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyRegisteredEvents } from '@/hooks/api/useGuestDashboard';
import { formatEventSchedule } from '@/lib/eventSchedule';
import type { RegisteredEventsFilter } from '@/lib/api/guest';

/**
 * src/components/guest/RegisteredEventsTab.tsx
 * -------------------------------------------------------------------------
 * The guest dashboard's "My Events" tab. Backed by GET /api/guest/events —
 * the `filter` tab (Upcoming / Past / All) is a query param, not a
 * client-side re-filter, so the count matches what's actually on the server.
 * -------------------------------------------------------------------------
 */

const FILTERS: { key: RegisteredEventsFilter; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'all', label: 'All' },
];

const RegisteredEventsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="border border-border overflow-hidden">
        <div className="aspect-video bg-muted" />

        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-muted rounded" />
            <div className="h-6 w-24 bg-muted rounded" />
            <div className="h-6 w-20 bg-muted rounded" />
          </div>

          <div className="h-5 w-3/4 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-2/3 bg-muted rounded" />
        </div>
      </div>
    ))}
  </div>
);

export const RegisteredEventsTab: React.FC = () => {
  const [filter, setFilter] =
    useState<RegisteredEventsFilter>('upcoming');

  const { data: events, isLoading } =
    useMyRegisteredEvents(filter);

  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Always visible toggle */}
      <div className="flex w-fit border border-border">
        {FILTERS.map(({ key, label }, index) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 text-[11px] uppercase font-medium transition-colors ${
              filter === key
                ? 'bg-foreground text-background'
                : 'bg-background hover:bg-muted'
            } ${
              index !== FILTERS.length - 1
                ? 'border-r border-border'
                : ''
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <RegisteredEventsSkeleton />
      ) : !events || events.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            {filter === 'upcoming' &&
              "You don't have any upcoming registered events"}
            {filter === 'past' &&
              "You don't have any past events"}
            {filter === 'all' &&
              'No registered events yet'}
          </p>

          <button
            onClick={() => navigate('/')}
            className="bg-foreground text-background px-6 py-3 text-sm uppercase font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            Discover Events
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {events.map((event) => {
            const schedule = formatEventSchedule(event.schedule);

            return (
              <div
                key={event.id}
                onClick={() => navigate(`/event/${event.id}`)}
                className="border border-border cursor-pointer hover:border-primary transition-colors"
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  <img
                    src={event.backgroundImageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span
                      className={`text-[11px] uppercase px-2 py-1 ${
                        event.isPast
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {event.isPast ? 'Past' : 'Upcoming'}
                    </span>

                    <span className="text-[11px] uppercase border border-border px-2 py-1">
                      {schedule.dateLabel}
                    </span>

                    <span className="text-[11px] uppercase border border-border px-2 py-1">
                      {schedule.timeLabel}
                    </span>
                  </div>

                  <h3 className="font-medium">{event.title}</h3>

                  <p className="text-sm text-muted-foreground mt-1">
                    {event.address}
                  </p>

                  {schedule.isMultiDay &&
                    schedule.endDateLabel && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Ends {schedule.endDateLabel}
                      </p>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};