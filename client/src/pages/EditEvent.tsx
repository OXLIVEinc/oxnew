import { useState, useRef, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { type User } from '@supabase/supabase-js';
import { AuthSheet } from '@/components/AuthSheet';
import { SEOHead } from '@/components/SEOHead';
import { Trash2 } from 'lucide-react';
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
import { VenueSeatingMapEditor } from '@/components/VenueSeatingMapEditor';
import { useEvent, useUpdateEvent } from '@/hooks/api/useEvents';
import { useAddTicketTier, useUpdateTicketTier, useDeleteTicketTier } from '@/hooks/api/useTicketTiers';
import { getApiErrorMessage } from '@/lib/api/http';
import { usePhotonAutocomplete } from '@/hooks/useLocationAutocomplete';
import { type LocationSuggestion, LocationSuggestions } from '@/components/LocationSuggestion';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const eventSchema = z.object({
  eventName: z.string().trim().min(1, 'Event name is required').max(200),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be HH:MM'),
  endTime: z.union([z.literal(''), z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be HH:MM')]),
  location: z.string().trim().min(1, 'Location is required').max(300),
  description: z.string().trim().min(1, 'Description is required').max(2000),
});

// Helper functions for time conversion
const convertTo24Hour = (
  hour12: number,
  minute: number,
  period: "AM" | "PM",
): string => {
  let hour24 = hour12;
  if (period === "PM" && hour12 !== 12) hour24 = hour12 + 12;
  if (period === "AM" && hour12 === 12) hour24 = 0;
  return `${hour24.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
};

const convertTo12Hour = (
  time24: string,
): { hour: number; minute: number; period: "AM" | "PM" } | null => {
  if (!time24) return null;
  const [hour24, minute] = time24.split(":").map(Number);
  let hour = hour24 % 12;
  if (hour === 0) hour = 12;
  const period = hour24 >= 12 ? "PM" : "AM";
  return { hour, minute, period };
};

const formatTimeForDisplay = (time24: string): string => {
  if (!time24) return "";
  return time24; // Already in 24h format as required
};

const TimePicker = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (time: string) => void;
  placeholder: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState<number>(12);
  const [minute, setMinute] = useState<number>(0);
  const [period, setPeriod] = useState<"AM" | "PM">("PM");

  // Initialize from value
  useEffect(() => {
    if (value) {
      const converted = convertTo12Hour(value);
      if (converted) {
        setHour(converted.hour);
        setMinute(converted.minute);
        setPeriod(converted.period);
      }
    }
  }, [value]);

  const handleSave = () => {
    const time24 = convertTo24Hour(hour, minute, period);
    onChange(time24);
    setIsOpen(false);
  };

  const displayTime = value ? formatTimeForDisplay(value) : placeholder;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="px-2 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-black text-center focus:outline-none placeholder:text-[#C4C4C4] w-full border-l border-black hover:bg-gray-50 transition-colors"
          type="button"
        >
          {displayTime || placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Select Time</div>
          </div>

          <div className="flex gap-3">
            {/* Hour */}
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Hour</label>
              <Select
                value={hour.toString()}
                onValueChange={(v) => setHour(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <SelectItem key={h} value={h.toString()}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Minute */}
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Minute</label>
              <Select
                value={minute.toString().padStart(2, "0")}
                onValueChange={(v) => setMinute(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                    <SelectItem key={m} value={m.toString().padStart(2, "0")}>
                      {m.toString().padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AM/PM */}
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Period</label>
              <Select
                value={period}
                onValueChange={(v) => setPeriod(v as "AM" | "PM")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AM">AM</SelectItem>
                  <SelectItem value="PM">PM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              Done
            </Button>
          </div>

          <div className="text-center text-xs text-gray-500">
            Will be stored and displayed as 24-hour format
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const EditEvent = () => {
  const { id } = useParams();
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('active');

  const [isPaid, setIsPaid] = useState(false);
  const [ticketTiers, setTicketTiers] = useState<TicketTierFormValue[]>([]);
  const [ageGroup, setAgeGroup] = useState('');
  const [genre, setGenre] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [venueMapPreview, setVenueMapPreview] = useState<string | null>(null);
  const [venueMapFile, setVenueMapFile] = useState<File | null>(null);

  const locationInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const {
    suggestions,
    loading: isLoading,
    error,
    search,
    clear,
  } = usePhotonAutocomplete();

  const { data: event, isLoading: isLoadingEvent, error: eventError } = useEvent(id);
  const updateEvent = useUpdateEvent(id ?? '');
  const addTicketTier = useAddTicketTier(id ?? '');
  const updateTicketTier = useUpdateTicketTier(id ?? '');
  const deleteTicketTier = useDeleteTicketTier(id ?? '');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (!session?.user) setShowAuthModal(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) setShowAuthModal(false);
      else setShowAuthModal(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (eventError) {
      toast.error(getApiErrorMessage(eventError, 'Failed to load event'));
      navigate('/my-events');
    }
  }, [eventError, navigate]);

  // Hydrate the form once from the fetched event
  useEffect(() => {
    if (!event || !user || hydrated) return;
    if (event.createdBy !== user.id) {
      toast.error('No permission');
      navigate('/my-events');
      return;
    }

    setEventName(event.title);
    setDescription(event.description ?? '');
    setLocation(event.address);
    setLocationLat(Number(event.locationLat));
    setLocationLng(Number(event.locationLng));
    setIsPaid(event.isPaid);
    setAgeGroup(event.ageGroup ?? '');
    setGenre(event.genre ?? '');
    setTags(event.tags ?? []);
    setCurrentStatus(event.status);
    setBannerPreview(event.desktopBannerUrl || event.backgroundImageUrl);
    setStartDate(new Date(event.schedule.date));
    setStartTime(event.schedule.time);
    if (event.schedule.endDate) setEndDate(new Date(event.schedule.endDate));
    setEndTime(event.schedule.endTime ?? '');

    setTicketTiers(
      event.ticketTiers.length > 0
        ? event.ticketTiers.map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description || '',
            price: Number(t.price),
            isUnlimited: t.isUnlimited,
            quantity: t.quantity ?? 0,
          }))
        : [createDefaultTicketTier()]
    );

    setGalleryItems(
      event.gallery.map((g) => ({
        preview: g.mediaUrl,
        media_url: g.mediaUrl,
        media_type: g.mediaType as 'image' | 'video',
      }))
    );

    // Check if venue map exists on the event (using type assertion since the type might not have it)
    const eventWithVenueMap = event as any;
    if (eventWithVenueMap.venueMap?.id) {
      setVenueMapPreview(eventWithVenueMap.venueMap.imageUrl);
    }

    setHydrated(true);
  }, [event, user, hydrated, navigate]);

  const uploadFile = async (file: File, prefix: string): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage.from('event-images').upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(fileName);
    return publicUrl;
  };

  const syncTicketTiers = async () => {
    const originalIds = new Set((event?.ticketTiers ?? []).map((t) => t.id));
    const keptIds = new Set(ticketTiers.filter((t) => t.id).map((t) => t.id as string));

    const toDelete = [...originalIds].filter((tid) => !keptIds.has(tid));
    for (const tierId of toDelete) {
      await deleteTicketTier.mutateAsync(tierId);
    }

    for (const tier of ticketTiers) {
      const input = {
        name: tier.name,
        description: tier.description || null,
        price: isPaid ? tier.price : 0,
        isUnlimited: tier.isUnlimited,
        quantity: tier.isUnlimited ? null : tier.quantity,
      };
      if (tier.id) {
        await updateTicketTier.mutateAsync({ tierId: tier.id, input });
      } else {
        await addTicketTier.mutateAsync(input);
      }
    }
  };

  const handleSubmit = async (draft = false) => {
    if (!user || !id) { setShowAuthModal(true); return; }
    if (!startDate) { toast.error('Please select a start date'); return; }
    if (endDate && !endTime) { toast.error('Please add an end time, or clear the end date'); return; }
    if (!endDate && endTime) { toast.error('Please add an end date, or clear the end time'); return; }
    if (locationLat === null || locationLng === null) {
      toast.error('Please re-select the location from the suggestions');
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

    setIsSubmitting(true);
    try {
      let bannerUrl = bannerPreview;
      if (bannerFile) bannerUrl = await uploadFile(bannerFile, 'event-banner');

      await updateEvent.mutateAsync({
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
        backgroundImageUrl: bannerUrl || undefined,
        desktopBannerUrl: bannerUrl,
        isPaid,
        ageGroup: ageGroup || null,
        genre: genre || null,
        tags: tags.length > 0 ? tags : undefined,
        status: draft ? 'draft' : (currentStatus as 'active' | 'draft'),
      });

      await syncTicketTiers();

      // Handle venue map update
      if (venueMapFile) {
        const mapUrl = await uploadFile(venueMapFile, 'venue-map');
        // Check if venue map exists using the event data
        const eventWithVenueMap = event as any;
        if (eventWithVenueMap.venueMap?.id) {
          await supabase
            .from('venue_maps')
            .update({ image_url: mapUrl })
            .eq('id', eventWithVenueMap.venueMap.id);
        } else {
          await supabase
            .from('venue_maps')
            .insert({ event_id: id, image_url: mapUrl });
        }
      }

      // Handle gallery updates
      for (let i = 0; i < galleryItems.length; i++) {
        const item = galleryItems[i];
        if (item.file) {
          const mediaUrl = await uploadFile(item.file, `gallery-${i}`);
          await supabase.from('event_gallery').insert({
            event_id: id,
            media_url: mediaUrl,
            media_type: item.media_type,
            sort_order: i,
          });
        }
      }

      toast.success('Event updated successfully!');
      navigate('/my-events');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error updating event:', error);
      toast.error(getApiErrorMessage(error, 'Failed to update event. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      toast.success('Event deleted successfully');
      navigate('/my-events');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  if (isLoadingEvent || !hydrated) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex h-screen items-center justify-center">
          <div className="text-[#1A1A1A] text-2xl">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title="Edit Event" description="Update your event details and settings" />
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

              {/* Start/End Date/Time */}
              <div className="relative">
                <div className="grid grid-cols-[80px_1fr_80px] md:grid-cols-[100px_1fr_100px] gap-0 border border-black mb-4 md:mb-6">
                  <div className="flex items-center justify-start gap-1.5 md:gap-2 border-r border-black px-2 md:px-3 py-2 md:py-3">
                    <div className="w-1.5 md:w-2 h-1.5 md:h-2 bg-black rounded-full"></div>
                    <span className="text-[14px] md:text-[17px] font-medium">Start</span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className={cn("px-2 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-left border-r border-black focus:outline-none bg-white", !startDate && "text-[#C4C4C4]")}>
                        {startDate ? format(startDate, "EEE, dd MMM") : "Select date"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                    </PopoverContent>
                  </Popover>
                  <TimePicker
                    value={startTime}
                    onChange={setStartTime}
                    placeholder="15:00"
                  />
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
                  <TimePicker
                    value={endTime}
                    onChange={setEndTime}
                    placeholder="16:00"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="relative">
                <input 
                  ref={locationInputRef} 
                  type="text" 
                  placeholder="Add event location" 
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-black border border-black focus:outline-none placeholder:text-[#C4C4C4]" 
                  value={location} 
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocation(value);
                    setLocationLat(null);
                    setLocationLng(null);
                    search(value);
                  }}
                />

                <LocationSuggestions
                  suggestions={suggestions}
                  loading={isLoading}
                  error={error}
                  onSelect={(place: LocationSuggestion) => {
                    setLocation(place.label);
                    setLocationLat(place.lat);
                    setLocationLng(place.lng);
                    clear();
                  }}
                />
              </div>

              {/* Description */}
              <textarea placeholder="Add description" rows={6} className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-black border border-black focus:outline-none resize-none placeholder:text-[#C4C4C4]" value={description} onChange={(e) => setDescription(e.target.value)} />

              {/* Event Metadata */}
              <EventMetadataForm ageGroup={ageGroup} genre={genre} tags={tags} onAgeGroupChange={setAgeGroup} onGenreChange={setGenre} onTagsChange={setTags} />

              {/* Ticket Tiers */}
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
                onMapImageChange={(file, preview) => {
                  setVenueMapFile(file);
                  setVenueMapPreview(preview);
                }}
              />

              {/* Submit Buttons */}
              <div className="flex gap-3 items-center mt-4 md:mt-8">
                <div className="group flex items-center self-stretch relative overflow-hidden flex-1">
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    className="flex h-[50px] justify-center items-center gap-2.5 border relative px-2.5 py-3.5 border-solid transition-all duration-300 ease-in-out w-[calc(100%-50px)] z-10 bg-[#1A1A1A] border-[#1A1A1A] group-hover:w-full group-hover:bg-[#FA76FF] group-hover:border-[#FA76FF] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-white text-[13px] font-normal uppercase relative transition-colors duration-300 group-hover:text-black">
                      {isSubmitting ? 'UPDATING...' : 'UPDATE EVENT'}
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
                <button
                  onClick={handleDeleteEvent}
                  className="flex w-[50px] h-[50px] justify-center items-center border border-red-500 bg-red-500 text-white transition-all duration-300 hover:bg-red-600 hover:border-red-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default EditEvent;