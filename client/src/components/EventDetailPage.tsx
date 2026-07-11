import React, { useState, useEffect } from 'react';
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
import { useGeoLocation } from '@/hooks/useGeoLocation';
import { AuthLoadingScreen } from './AuthLoading';
import { useAuth } from '@/context/AuthContext';
import { useRef } from 'react';

interface Event {
  id: string;
  title: string;
  creator: string;
  description: string;
  date: string;
  time: string;
  address: string;
  background_image_url: string;
  target_date: string;
  is_paid: boolean;
  age_group: string | null;
  genre: string | null;
  tags: string[] | null;
  mobile_banner_url: string | null;
  desktop_banner_url: string | null;
  created_by: string;
}

interface TicketTier {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  sold: number;
}

// Pre-defined gradient combinations for variety
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

// Pre-defined overlay gradients
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
  const geo = useGeoLocation();
  const [isRegistered, setIsRegistered] = useState(false);
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTiers, setTicketTiers] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const  {isHotelPartner} = useAuth()
  const asideRef = useRef<HTMLDivElement>(null);

const handleWheel = (e: React.WheelEvent) => {
  e.preventDefault();

  asideRef.current?.scrollBy({
    top: e.deltaY,
    behavior: "auto",
  });
};

  
  // Generate random gradients on component mount
  const [randomGradient, setRandomGradient] = useState('');
  const [randomOverlay, setRandomOverlay] = useState('');
  
  useEffect(() => {
    // Pick random gradients from the arrays
    const gradient = gradientCombinations[Math.floor(Math.random() * gradientCombinations.length)];
    const overlay = overlayCombinations[Math.floor(Math.random() * overlayCombinations.length)];
    setRandomGradient(gradient);
    setRandomOverlay(overlay);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    fetchEvent();
    checkRegistration();

    // Real-time subscription for ticket tier sold counts
    if (id) {
      const channel = supabase
        .channel(`ticket-tiers-${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'ticket_tiers', filter: `event_id=eq.${id}` }, () => {
          fetchTicketTiers(id);
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [id]);

  const fetchTicketTiers = async (eventId: string) => {
    const { data: tiers } = await supabase
      .from('ticket_tiers')
      .select('*')
      .eq('event_id', eventId)
      .order('sort_order', { ascending: true });
    if (tiers) {
      setTicketTiers(tiers);
      if (!selectedTierId && tiers.length > 0) setSelectedTierId(tiers[0].id);
    }
  };
  
  const fetchEvent = async () => {
    const { data, error } = id
      ? await supabase.from('events').select('*').eq('id', id).maybeSingle()
      : await supabase.from('events').select('*').limit(1).maybeSingle();
    
    if (error || !data) {
      setNotFound(true);
    } else {
      setEvent(data);
      await fetchTicketTiers(data.id);
    }
    setLoading(false);
  };

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

  const handleGetDirections = () => {
    window.open('https://maps.google.com', '_blank');
  };

  if (loading) {
    return <AuthLoadingScreen/>;
  }

  if (notFound || !event) {
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

  const bgImage = event.desktop_banner_url || event.background_image_url;

  return <>
    <SEOHead 
      title={event.title}
      description={event.description.substring(0, 160)}
      image={event.background_image_url}
      keywords={`event, ${event.title}, ${event.address}, community event`}
    />
    <link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <Navbar />

    <main className="flex h-screen flex-col w-full relative bg-white mx-auto my-0 lg:flex-row">
      {/* Image container with random gradient background and centered image */}
      <div 
        onWheel={handleWheel}
        className="flex flex-col h-screen justify-end items-center fixed w-[calc(100%-540px)] left-0 top-0 overflow-hidden max-lg:relative max-lg:w-full" 
        role="img" 
        aria-label="Event background image"
      >
        <div className={`relative w-full h-full p-10 bg-gradient-to-br ${randomGradient} flex items-center justify-center`}>
          {/* Decorative gradient overlay with random combination */}
          <div className={`absolute inset-0 bg-gradient-to-tr ${randomOverlay}`}></div>
          
          {/* Image container with proper centering */}
          <div className="relative w-full max-w-4xl aspect-video mx-auto my-8 rounded-2xl shadow-2xl overflow-hidden">
            <img
              src={bgImage}
              alt={event.title}
              className="w-full h-full object-cover animate-[zoom-in_1.2s_ease-out_forwards]"
            />
            {/* Inner shadow for elegant framing */}
            <div className="absolute inset-0 shadow-inner pointer-events-none"></div>
          </div>
          
          {/* Countdown overlay positioned at bottom left of image */}
          <div className="absolute bottom-8 left-8 z-10 animate-fade-in" style={{ animationDelay: '0.5s', animationFillMode: 'both' }}>
            <EventCountdown targetDate={new Date(event.target_date)} />
          </div>
        </div>
      </div>
      
      <aside  ref={asideRef} className="flex w-full pb-2 lg:w-[540px] flex-col justify-start items-start lg:fixed lg:h-[calc(100vh-5rem)] lg:right-0 lg:top-0 bg-white lg:overflow-y-auto">
        <div className="flex w-full  flex-col items-start relative p-6  pb-2 gap-8 opacity-0 animate-fade-in [animation-delay:200ms]">
          <div className="flex flex-col items-start gap-4 self-stretch relative">
            <EventMeta date={event.date} time={event.time} />
            <EventHeader title={event.title} creator={event.creator} creatorUserId={event.created_by} />
            <EventTagsDisplay ageGroup={event.age_group} genre={event.genre} tags={event.tags} />
            <EventLikeShare eventId={event.id} eventTitle={event.title} onAuthRequired={() => setIsAuthOpen(true)} />
          </div>
          
          <EventDescription description={event.description} />

          {/* Ticket Tiers Display with real-time availability */}
          {ticketTiers.length > 0 && (
            <section className="flex flex-col items-start gap-4 self-stretch">
              <div className="flex flex-col items-start gap-5 self-stretch">
                <hr className="h-px self-stretch bg-[#1A1A1A] border-0" />
                <h2 className="text-[#1A1A1A] text-[11px] font-normal uppercase">TICKETS</h2>
              </div>
              <div className="flex flex-col gap-2 self-stretch">
                {ticketTiers.map((tier) => {
                  const available = tier.quantity - tier.sold;
                  const soldOut = (tier as any).is_sold_out || available <= 0;
                  const pctSold = Math.min((tier.sold / tier.quantity) * 100, 100);
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
                          <div className={`text-[11px] uppercase ${soldOut ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                            {soldOut ? 'Sold out' : `${available} left`}
                          </div>
                        </div>
                      </div>
                      {/* Progress bar */}
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


       <div className="sticky h-[5rem] bg-white flex items-center justify-center  bottom-0 w-full py-6 border-t border-border lg:fixed lg:bottom-0 lg:right-0 lg:w-[540px]">
          <div className="px-6 lg:px-10 w-full">
            {
              isHotelPartner?
              <>
               <div className='font-bold'>
                 {
                  event.title
                 }
               </div>
              </>:
               <EventRegistration 
              eventId={event.id}
              onRegister={() => { checkRegistration(); fetchTicketTiers(event.id); }}
              isRegistered={isRegistered}
              onAuthRequired={() => setIsAuthOpen(true)}
              targetDate={new Date(event.target_date)}
              ticketTiers={ticketTiers}
              selectedTierId={selectedTierId}
              className="opacity-0 animate-fade-in [animation-delay:400ms]" 
            />
            }
          </div>
        </div>
     
    </main>
    <AuthSheet isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
  </>;
};