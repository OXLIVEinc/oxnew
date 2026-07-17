import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/context/AuthContext';
import { useMyOrganizerEvents, useDeleteEvent } from '@/hooks/api/useEvents';
import { useMyRegisteredEvents } from '@/hooks/api/useGuestDashboard';
import { formatEventSchedule } from '@/lib/eventSchedule';
import { getApiErrorMessage } from '@/lib/api/http';

interface EventCardData {
  id: string;
  title: string;
  backgroundImageUrl: string;
  dateLabel: string;
  timeLabel: string;
}

const EventCard = ({
  event,
  isCreated,
  onDelete,
}: {
  event: EventCardData;
  isCreated?: boolean;
  onDelete?: (id: string) => void;
}) => {
  const navigate = useNavigate();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this event?')) {
      onDelete?.(event.id);
    }
  };

  return (
    <div
      className="relative cursor-pointer group"
      onClick={() => navigate(isCreated ? `/event/${event.id}/edit` : `/event/${event.id}`)}
    >
      <div className="overflow-hidden mb-3">
        <div className="aspect-video bg-muted relative">
          <img
            src={event.backgroundImageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
            loading="lazy"
          />
        </div>
      </div>
      <div className="absolute top-4 left-4 flex flex-col gap-0">
        <div className="bg-white border border-black px-3 h-[23px] flex items-center">
          <div className="text-[11px] font-medium uppercase leading-none">{event.dateLabel}</div>
        </div>
        <div className="bg-white border border-t-0 border-black px-3 h-[23px] flex items-center">
          <div className="text-[11px] font-medium leading-none">{event.timeLabel}</div>
        </div>
      </div>
      {isCreated && (
        <button
          onClick={handleDelete}
          className="absolute top-4 right-4 bg-white border border-black p-2 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Delete event"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      <h3 className="text-base font-medium">{event.title}</h3>
    </div>
  );
};

const MyEvents = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'created' | 'registered'>('created');

  const { data: createdRaw, isLoading: createdLoading } = useMyOrganizerEvents();
  const { data: registeredRaw, isLoading: registeredLoading } = useMyRegisteredEvents('all');
  const deleteEvent = useDeleteEvent();

  useEffect(() => {
    if (!authLoading && !user) navigate('/');
  }, [authLoading, user, navigate]);

  const createdEvents: EventCardData[] = (createdRaw ?? []).map((e) => {
    const schedule = formatEventSchedule(e.schedule);
    return {
      id: e.id,
      title: e.title,
      backgroundImageUrl: e.backgroundImageUrl,
      dateLabel: schedule.dateLabel,
      timeLabel: schedule.timeLabel,
    };
  });

  const registeredEvents: EventCardData[] = (registeredRaw ?? []).map((e) => {
    const schedule = formatEventSchedule(e.schedule);
    return {
      id: e.id,
      title: e.title,
      backgroundImageUrl: e.backgroundImageUrl,
      dateLabel: schedule.dateLabel,
      timeLabel: schedule.timeLabel,
    };
  });

  const loading = createdLoading || registeredLoading;
  const displayedEvents = activeTab === 'created' ? createdEvents : registeredEvents;

  const handleDeleteEvent = (eventId: string) => {
    deleteEvent.mutate(eventId, {
      onSuccess: () => toast.success('Event deleted successfully'),
      onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete event')),
    });
  };

  if (!user) return null;

  return (
    <>
      <SEOHead
        title="My Events"
        description="Manage your created events and view events you've registered for"
      />
      <link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <div className="min-h-screen bg-white">
        <Navbar />

        <div className="pt-32 pb-20 px-4 md:px-8">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-tight mb-8">
              My Events
            </h1>

            <div className="flex gap-0 mb-12">
              <button
                onClick={() => setActiveTab('created')}
                className={`px-6 py-3 text-[11px] font-medium uppercase border border-black transition-colors max-sm:flex-1 ${
                  activeTab === 'created' ? 'bg-[#ff6bff] text-black' : 'bg-transparent text-black'
                }`}
              >
                Created by me ({createdEvents.length})
              </button>
              <button
                onClick={() => setActiveTab('registered')}
                className={`px-6 py-3 text-[11px] font-medium uppercase border border-l-0 border-black transition-colors max-sm:flex-1 ${
                  activeTab === 'registered' ? 'bg-[#ff6bff] text-black' : 'bg-transparent text-black'
                }`}
              >
                Registered ({registeredEvents.length})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
              {loading ? (
                <div className="col-span-full text-center py-12">Loading events...</div>
              ) : displayedEvents.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  {activeTab === 'created'
                    ? "You haven't created any events yet"
                    : "You haven't registered for any events yet"}
                </div>
              ) : (
                displayedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    isCreated={activeTab === 'created'}
                    onDelete={activeTab === 'created' ? handleDeleteEvent : undefined}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MyEvents;