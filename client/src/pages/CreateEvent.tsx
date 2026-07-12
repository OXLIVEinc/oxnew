import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGooglePlacesAutocomplete } from '@/hooks/useGooglePlacesAutocomplete';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthSheet } from '@/components/AuthSheet';
import { SEOHead } from '@/components/SEOHead';
import { z } from 'zod';
import {
  EventTicketTiers,
  createDefaultTicketTier,
  validateTicketTiers,
  type TicketTierFormValue,
} from '@/components/EventTicketTiers';
import { EventMetadataForm } from '@/components/EventMetadataForm';
import { EventBannerUpload } from '@/components/EventBannerUpload';
import { EventGalleryUpload, type GalleryItem } from '@/components/EventGalleryUpload';
import { VenueSeatingMapEditor, type VenueSection } from '@/components/VenueSeatingMapEditor';
import { useCreateEvent } from '@/hooks/api/useEvents';
import { getApiErrorMessage } from '@/lib/api/http';
import type { CreateEventPayload } from '@/lib/api/types';
import { useAuth } from '@/context/AuthContext';
const eventSchema = z.object({
  eventName: z.string().trim().min(1, 'Event name is required').max(200),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be HH:MM'),
  endTime: z.union([z.literal(''), z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be HH:MM')]),
  location: z.string().trim().min(1, 'Location is required').max(300),
  description: z.string().trim().min(1, 'Description is required').max(2000),
});

const CreateEvent = () => {
  const [eventName, setEventName] = useState('');
  // startsAt/startTime are REQUIRED per the schema; endsAt/endTime are optional.
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  const [isPaid, setIsPaid] = useState(false);
  // Every event needs at least one ticket tier — seed with the default
  // General Admission tier (organizer can rename/edit or add more).
  const [ticketTiers, setTicketTiers] = useState<TicketTierFormValue[]>([createDefaultTicketTier()]);
  const [ageGroup, setAgeGroup] = useState('');
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [venueMapPreview, setVenueMapPreview] = useState<string | null>(null);
  const [venueMapFile, setVenueMapFile] = useState<File | null>(null);
  const [venueSections, setVenueSections] = useState<VenueSection[]>([]);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { onPlaceSelected } = useGooglePlacesAutocomplete(locationInputRef);
  const createEvent = useCreateEvent();
  const { authUser: user } = useAuth();
 
  useEffect(() => {
  setShowAuthModal(!user);
}, [user]);

  useEffect(() => {
    onPlaceSelected((place) => {
      setLocation(place.formatted_address || place.name || '');
      // geometry.location is a Google LatLng object with lat()/lng() accessors.
      const geometry = place.geometry as { location?: { lat: () => number; lng: () => number } } | undefined;
      if (geometry?.location) {
        setLocationLat(geometry.location.lat());
        setLocationLng(geometry.location.lng());
      }
    });
  }, [onPlaceSelected]);

  const uploadFile = async (file: File, prefix: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage.from('event-images').upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (draft = false) => {
    if (!user) { setShowAuthModal(true); return; }
    if (!startDate) { toast.error('Please select a start date'); return; }
    if (!bannerFile) { toast.error('Please upload an event banner'); return; }
    if (endDate && !endTime) { toast.error('Please add an end time, or clear the end date'); return; }
    if (!endDate && endTime) { toast.error('Please add an end date, or clear the end time'); return; }
    if (locationLat === null || locationLng === null) {
      toast.error('Please pick a location from the suggestions so we can place it on the map');
      return;
    }

    const validationResult = eventSchema.safeParse({
      eventName,
      startTime,
      endTime: endTime || '',
      location,
      description,
    });
    if (!validationResult.success) { toast.error(validationResult.error.issues[0].message); return; }

    const tierError = validateTicketTiers(ticketTiers, isPaid);
    if (tierError) { toast.error(tierError); return; }

    if (endDate && endTime) {
      const startDateTime = new Date(startDate);
      const [startH, startM] = startTime.split(':');
      startDateTime.setHours(parseInt(startH, 10), parseInt(startM, 10), 0, 0);
      const endDateTime = new Date(endDate);
      const [endH, endM] = endTime.split(':');
      endDateTime.setHours(parseInt(endH, 10), parseInt(endM, 10), 0, 0);
      if (endDateTime <= startDateTime) { toast.error('End date/time must be after start'); return; }
    }

    try {
      const backgroundImageUrl = await uploadFile(bannerFile, 'event-banner');

      let venueMapPayload: CreateEventPayload['venueMap'] = null;
      if (venueMapFile) {
        const imageUrl = await uploadFile(venueMapFile, 'venue-map');
        venueMapPayload = {
          imageUrl,
          sections: venueSections.map((s) => ({
            name: s.name,
            color: s.color,
            capacity: s.capacity,
            // VenueSeatingMapEditor references tiers by array index (as a string) — see
            // the `ticketTiers` prop passed to it below.
            tierIndex: s.ticket_tier_id !== null ? parseInt(s.ticket_tier_id, 10) : null,
          })),
        };
      }

      const gallery: { mediaUrl: string; mediaType: string }[] = [];
      for (let i = 0; i < galleryItems.length; i++) {
        const item = galleryItems[i];
        if (item.file) {
          const mediaUrl = await uploadFile(item.file, `gallery-${i}`);
          gallery.push({ mediaUrl, mediaType: item.media_type });
        }
      }

      const payload: CreateEventPayload = {
        title: eventName,
        description,
        startsAt: startDate.toISOString(),
        startTime,
        endsAt: endDate && endTime ? endDate.toISOString() : null,
        endTime: endTime || null,
        venue: location,
        address: location,
        locationLat,
        locationLng,
        backgroundImageUrl,
        isPaid,
        ageGroup: ageGroup || null,
        genre: genre || null,
        tags: tags.length > 0 ? tags : undefined,
        status: draft ? 'draft' : 'active',
        ticketTiers: ticketTiers.map((t) => ({
          name: t.name,
          description: t.description || null,
          price: isPaid ? t.price : 0,
          isUnlimited: t.isUnlimited,
          quantity: t.isUnlimited ? null : t.quantity,
        })),
        gallery: gallery.length > 0 ? gallery : undefined,
        venueMap: venueMapPayload,
      };

      await createEvent.mutateAsync(payload);

      toast.success(draft ? 'Event saved as draft!' : 'Event created successfully!');
      navigate('/my-events');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error creating event:', error);
      toast.error(getApiErrorMessage(error, 'Failed to create event. Please try again.'));
    }
  };

  const isSubmitting = createEvent.isPending;

  return (
    <>
      <SEOHead title="Create Event" description="Create and publish a new event" />
      <AuthSheet isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      <div className="min-h-screen bg-white">
        <Navbar />
        
        {user ? (
          <div className="max-w-4xl mx-auto pt-24 md:pt-32 pb-8 md:pb-16 px-4 md:px-8">
            <div className="space-y-6 md:space-y-8">
              <input
                type="text"
                placeholder="Event name"
                className="w-full text-black text-[32px] md:text-[48px] lg:text-[56px] font-medium leading-none focus:outline-none bg-transparent border-none p-0 placeholder:text-[#C4C4C4]"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />

              {/* Start/End Date/Time — start is required, end is optional */}
              <div className="relative">
                <div className="grid grid-cols-[80px_1fr_80px] md:grid-cols-[100px_1fr_100px] gap-0 border border-black mb-4 md:mb-6">
                  <div className="flex items-center justify-start gap-1.5 md:gap-2 border-r border-black px-2 md:px-3 py-2 md:py-3">
                    <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-black rounded-full"></div>
                    <span className="text-[14px] md:text-[17px] font-medium">Start</span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn("px-2 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-left border-r border-black focus:outline-none bg-white", !startDate && "text-[#C4C4C4]")}>
                        {startDate ? format(startDate, "EEE, dd MMM") : "Thu, 28 Oct"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                  <input type="text" placeholder="15:00" className="px-2 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-black text-center focus:outline-none placeholder:text-[#C4C4C4]" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>

                <div className="grid grid-cols-[80px_1fr_80px] md:grid-cols-[100px_1fr_100px] gap-0 border border-black">
                  <div className="flex items-center justify-start gap-1.5 md:gap-2 border-r border-black px-2 md:px-3 py-2 md:py-3">
                    <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-black rounded-full"></div>
                    <span className="text-[14px] md:text-[17px] font-medium">End (optional)</span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn("px-2 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-left border-r border-black focus:outline-none bg-white", !endDate && "text-[#C4C4C4]")}>
                        {endDate ? format(endDate, "EEE, dd MMM") : "None"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                  <input type="text" placeholder="16:00" className="px-2 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-black text-center focus:outline-none placeholder:text-[#C4C4C4]" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                </div>
              </div>

              {/* Location */}
              <input ref={locationInputRef} type="text" placeholder="Add event location" className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-black border border-black focus:outline-none placeholder:text-[#C4C4C4]" value={location} onChange={(e) => { setLocation(e.target.value); setLocationLat(null); setLocationLng(null); }} />

              {/* Description */}
              <textarea placeholder="Add description" rows={6} className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-black border border-black focus:outline-none resize-none placeholder:text-[#C4C4C4]" value={description} onChange={(e) => setDescription(e.target.value)} />

              {/* Event Metadata */}
              <EventMetadataForm ageGroup={ageGroup} genre={genre} tags={tags} onAgeGroupChange={setAgeGroup} onGenreChange={setGenre} onTagsChange={setTags} />

              {/* Ticket Tiers — every event needs at least one */}
              <EventTicketTiers tiers={ticketTiers} onChange={setTicketTiers} isPaid={isPaid} onPaidChange={setIsPaid} />

              {/* Banner */}
              <EventBannerUpload
                bannerPreview={bannerPreview}
                onBannerChange={(file, preview) => { setBannerFile(file); setBannerPreview(preview); }}
              />

              {/* Gallery */}
              <EventGalleryUpload items={galleryItems} onChange={setGalleryItems} />

              {/* Venue Seating Map */}
              <VenueSeatingMapEditor
                mapImagePreview={venueMapPreview}
                onMapImageChange={(file, preview) => { setVenueMapFile(file); setVenueMapPreview(preview); }}
                sections={venueSections}
                onSectionsChange={setVenueSections}
                ticketTiers={ticketTiers.map((t, i) => ({ id: i.toString(), name: t.name, price: t.price }))}
              />
              {/* Submit Buttons */}
              <div className="flex gap-3 mt-4 md:mt-8">
                <div className="group flex items-center self-stretch relative overflow-hidden flex-1">
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    className="flex h-[50px] justify-center items-center gap-2.5 border relative px-2.5 py-3.5 border-solid transition-all duration-300 ease-in-out w-[calc(100%-50px)] z-10 bg-[#1A1A1A] border-[#1A1A1A] group-hover:w-full group-hover:bg-[#FA76FF] group-hover:border-[#FA76FF] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-white text-[13px] font-normal uppercase relative transition-colors duration-300 group-hover:text-black">
                      {isSubmitting ? 'CREATING...' : 'PUBLISH EVENT'}
                    </span>
                  </button>
                  <div className="flex w-[50px] h-[50px] justify-center items-center border absolute right-0 bg-white rounded-[99px] border-solid border-[#1A1A1A] transition-all duration-300 ease-in-out group-hover:opacity-0 group-hover:scale-50 pointer-events-none z-0">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                      <path d="M0.857178 6H10.3929" stroke="#1A1A1A" strokeWidth="1.5" />
                      <path d="M6.39282 10L10.3928 6L6.39282 2" stroke="#1A1A1A" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="h-[50px] px-6 text-[13px] font-normal uppercase border border-black bg-white text-black hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Save Draft
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default CreateEvent;
