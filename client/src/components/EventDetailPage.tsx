import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from './Navbar';
import { EventCountdown } from './EventCountdown';
import { EventMeta } from './EventMeta';
import { EventHeader } from './EventHeader';
import { EventDescription } from './EventDescription';
import { EventLocation } from './EventLocation';
import { EventRegistration } from './EventRegistration';
import { AuthSheet } from './AuthSheet';
import { SEOHead } from './SEOHead';
import { EventLikeShare } from './EventLikeShare';
import { EventGalleryDisplay } from './EventGalleryDisplay';
import { EventTagsDisplay } from './EventTagsDisplay';
import { VenueSeatingMapDisplay } from './VenueSeatingMapDisplay';
import { AuthLoadingScreen } from './AuthLoading';
import { useAuth } from '@/context/AuthContext';
import { useEvent } from '@/hooks/api/useEvents';
import { formatEventSchedule } from '@/lib/eventSchedule';

const gradientCombinations = [
  'from-purple-600 via-pink-500 to-orange-400',
  'from-blue-600 via-cyan-500 to-teal-400',
  'from-red-600 via-yellow-500 to-orange-400',
  'from-green-600 via-emerald-500 to-teal-400',
  'from-indigo-600 via-purple-500 to-pink-400',
  'from-yellow-600 via-orange-500 to-red-400',
  'from-pink-600 via-rose-500 to-red-400',
  'from-cyan-600 via-blue-500 to-indigo-400',
  'from-violet-600 via-purple-500 to-fuchsia-400',
  'from-amber-600 via-yellow-500 to-lime-400',
  'from-emerald-600 via-teal-500 to-cyan-400',
  'from-rose-600 via-pink-500 to-purple-400',
];

const overlayCombinations = [
  'from-purple-900/30 via-transparent to-pink-500/20',
  'from-blue-900/30 via-transparent to-cyan-500/20',
  'from-red-900/30 via-transparent to-yellow-500/20',
  'from-green-900/30 via-transparent to-teal-500/20',
  'from-indigo-900/30 via-transparent to-purple-500/20',
  'from-pink-900/30 via-transparent to-rose-500/20',
];

export const EventDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const { isHotelPartner } = useAuth();
  const asideRef = useRef<HTMLDivElement>(null);
  const { data: event, isLoading: loading, isError, refetch } = useEvent(id);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    asideRef.current?.scrollBy({ top: e.deltaY, behavior: 'auto' });
  };

  const [_, setRandomGradient] = useState('');
  const [randomOverlay, setRandomOverlay] = useState('');

  useEffect(() => {
    const gradient = gradientCombinations[Math.floor(Math.random() * gradientCombinations.length)];
    const overlay = overlayCombinations[Math.floor(Math.random() * overlayCombinations.length)];
    setRandomGradient(gradient);
    setRandomOverlay(overlay);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const checkRegistration = async () => {
    if (!id) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { data } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('event_id', id)
      .maybeSingle();
    setIsRegistered(!!data);
  };

  useEffect(() => {
    checkRegistration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (event && event.ticketTiers.length > 0 && !selectedTierId) {
      setSelectedTierId(event.ticketTiers[0].id);
    }
  }, [event, selectedTierId]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`ticket-tiers-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_tiers', filter: `event_id=eq.${id}` }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, refetch]);

  const handleGetDirections = () => {
    window.open('https://maps.google.com', '_blank');
  };

  if (loading) return <AuthLoadingScreen />;
  if (isError || !event) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-white px-4">
        <SEOHead title="Event Not Found" description="The event you're looking for doesn't exist." />
        <Navbar />
        <div className="text-center mt-20">
          <h1 className="text-4xl font-medium mb-4 text-[#1A1A1A]">Event Not Found</h1>
          <p className="text-lg text-[#1A1A1A] opacity-70 mb-8">The event you're looking for doesn't exist or has been removed.</p>
          <button onClick={() => navigate('/discover')} className="px-6 py-3 bg-[#1A1A1A] text-white border border-[#1A1A1A] hover:bg-white hover:text-[#1A1A1A] transition-colors uppercase text-sm font-medium">
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  const schedule = formatEventSchedule(event.schedule);
  const targetDate = new Date(`${event.schedule.date}T${event.schedule.time}`);
  const bgImage = event.desktopBannerUrl || event.backgroundImageUrl;

  const ticketTiers = event.ticketTiers.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    price: Number(t.price),
    quantity: t.isUnlimited ? Number.MAX_SAFE_INTEGER : (t.quantity ?? 0),
    sold: t.sold,
    is_sold_out: t.isSoldOut,
  }));

  return (
    <>
      <SEOHead
        title={event.title}
        description={(event.description ?? '').substring(0, 160)}
        image={event.backgroundImageUrl}
        keywords={`event, ${event.title}, ${event.address}, community event`}
      />
      <link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <Navbar />

      <main className="flex min-h-screen flex-col w-full relative bg-white mx-auto my-0 lg:flex-row">
        {/* Event Image / Hero Section */}
        <div
          onWheel={handleWheel}
          className="relative w-full lg:fixed lg:left-0 lg:top-0 lg:w-[calc(100%-540px)] lg:h-screen overflow-hidden flex flex-col justify-center lg:justify-end items-center"
          role="img"
          aria-label="Event background image"
        >
          {/* Mobile: Full-bleed image, no gradient */}
          <div className="relative w-full h-[40vh] lg:hidden">
            <img
              src={bgImage}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30" /> {/* Optional subtle dark overlay for text readability */}
            <div className="absolute bottom-6 left-6 z-10">
              <EventCountdown targetDate={targetDate} />
            </div>
          </div>

          {/* Desktop: Original gradient + card design */}
          <div className="hidden lg:flex relative w-full h-full p-10 bg-gradient-to-br ${randomGradient} flex items-center justify-center">
            <div className={`absolute inset-0 bg-gradient-to-tr ${randomOverlay}`}></div>
            <div className="relative w-full max-w-5xl aspect-video mx-auto rounded-2xl shadow-2xl overflow-hidden">
              <img
                src={bgImage}
                alt={event.title}
                className="w-full h-full object-cover animate-[zoom-in_1.2s_ease-out_forwards]"
              />
              <div className="absolute inset-0 shadow-inner pointer-events-none"></div>
            </div>

            <div className="absolute bottom-8 left-8 z-10">
              <EventCountdown targetDate={targetDate} />
            </div>
          </div>
        </div>

        {/* Content Sidebar */}
        <aside
          ref={asideRef}
          className="flex w-full lg:w-[540px] flex-col justify-start items-start lg:fixed lg:h-[calc(100vh-5rem)] lg:right-0 lg:top-0 bg-white lg:overflow-y-auto pt-6 lg:pt-0"
        >
          <div className="flex w-full flex-col items-start relative p-6 pb-2 gap-8 opacity-0 animate-fade-in [animation-delay:200ms]">
            <div className="flex flex-col items-start gap-4 self-stretch relative">
              <EventMeta date={schedule.dateLabel} time={schedule.timeLabel} />
              <EventHeader title={event.title} creatorUserId={event.createdBy} />
              <EventTagsDisplay ageGroup={event.ageGroup} genre={event.genre} tags={event.tags} />
              <EventLikeShare eventCode={event.eventCode} eventId={event.id} eventTitle={event.title}  />
            </div>

            <EventDescription description={event.description ?? ''} />

            {ticketTiers.length > 0 && (
              <section className="flex flex-col items-start gap-4 self-stretch">
                <div className="flex flex-col items-start gap-5 self-stretch">
                  <hr className="h-px self-stretch bg-[#1A1A1A] border-0" />
                  <h2 className="text-[#1A1A1A] text-[11px] font-normal uppercase">TICKETS</h2>
                </div>
                <div className="flex flex-col gap-2 self-stretch">
                  {ticketTiers.map((tier) => {
                    const available = tier.quantity - tier.sold;
                    const soldOut = tier.is_sold_out || available <= 0;
                    const pctSold = tier.quantity > 0 ? Math.min((tier.sold / tier.quantity) * 100, 100) : 0;

                    return (
                      <button
                        key={tier.id}
                        onClick={() => !soldOut && setSelectedTierId(tier.id)}
                        disabled={soldOut}
                        className={`flex flex-col w-full px-4 py-3 border transition-colors text-left ${
                          selectedTierId === tier.id
                            ? 'border-[#FA76FF] bg-[#FA76FF]/5'
                            : 'border-[#1A1A1A] hover:bg-gray-50'
                        } ${soldOut ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="text-[14px] font-medium">{tier.name}</div>
                            {tier.description && <div className="text-[12px] text-gray-500 mt-0.5">{tier.description}</div>}
                          </div>
                          <div className="text-right">
                            <div className="text-[14px] font-medium">
                              {tier.price > 0 ? `₦${tier.price.toFixed(2)}` : 'Free'}
                            </div>
                            <div className={`text-[11px] uppercase mt-0.5 ${soldOut ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                              {soldOut ? 'Sold out' : tier.quantity === Number.MAX_SAFE_INTEGER ? 'Available' : `${available} left`}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 h-1 mt-2 rounded-full overflow-hidden">
                          <div
                            className={`h-1 transition-all duration-500 rounded-full ${soldOut ? 'bg-red-500' : 'bg-[#FA76FF]'}`}
                            style={{ width: `${pctSold}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            <VenueSeatingMapDisplay
              eventId={event.id}
              ticketTiers={ticketTiers}
              selectedTierId={selectedTierId}
              onSelectTier={setSelectedTierId}
            />
            <EventGalleryDisplay eventId={event.id} />
            <EventLocation address={event.address} onGetDirections={handleGetDirections} />
          </div>
        </aside>

        {/* Registration Footer */}
        <div className="sticky h-[5rem] bg-white flex items-center justify-center bottom-0 w-full py-6 border-t border-border lg:fixed lg:bottom-0 lg:right-0 lg:w-[540px]">
          <div className="px-6 lg:px-10 w-full">
            {isHotelPartner ? (
              <div className="font-bold">{event.title}</div>
            ) : (
              <EventRegistration
                eventId={event.id}
                isPaid={event.isPaid}
                onRegister={() => { checkRegistration(); refetch(); }}
                isRegistered={isRegistered}
                targetDate={targetDate}
                ticketTiers={ticketTiers}
                selectedTierId={selectedTierId}
                className="opacity-0 animate-fade-in [animation-delay:400ms]"
              />
            )}
          </div>
        </div>
      </main>

      <AuthSheet isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
};