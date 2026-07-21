import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import LocationMapModal from "@/components/LocationMapModal";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AuthSheet } from "@/components/AuthSheet";
import { SEOHead } from "@/components/SEOHead";
import { z } from "zod";
import {
  EventTicketTiers,
  createDefaultTicketTier,
  validateTicketTiers,
  type TicketTierFormValue,
} from "@/components/EventTicketTiers";
import { EventMetadataForm } from "@/components/EventMetadataForm";
import { EventBannerUpload } from "@/components/EventBannerUpload";
import {
  EventGalleryUpload,
  type GalleryItem,
} from "@/components/EventGalleryUpload";
import { VenueSeatingMapEditor } from "@/components/VenueSeatingMapEditor";
import { useCreateEvent } from "@/hooks/api/useEvents";
import { getApiErrorMessage } from "@/lib/api/http";
import type { CreateEventPayload } from "@/lib/api/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin } from "lucide-react";
import { EventCreatedModal } from "@/components/EventCreatedModal";

const eventSchema = z.object({
  eventName: z.string().trim().min(1, "Event name is required").max(200),
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be HH:MM"),
  endTime: z.union([
    z.literal(""),
    z
      .string()
      .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be HH:MM"),
  ]),
  location: z.string().trim().min(1, "Location is required").max(300),
  description: z.string().trim().min(1, "Description is required").max(2000),
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

const CreateEvent = () => {
  const [eventName, setEventName] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [geocodedAddress, setGeocodedAddress] = useState<string | null>(null);

  const [isPaid, setIsPaid] = useState(false);
  const [ticketTiers, setTicketTiers] = useState<TicketTierFormValue[]>([
    createDefaultTicketTier(),
  ]);
  const [ageGroup, setAgeGroup] = useState("");
  const [genre, setGenre] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [venueMapPreview, setVenueMapPreview] = useState<string | null>(null);
  const [venueMapFile, setVenueMapFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdEvent, setCreatedEvent] = useState<{
    status: string;
    approvalStatus?: string;
  } | null>(null);

  const navigate = useNavigate();

  const [showMapModal, setShowMapModal] = useState(false);

  const createEvent = useCreateEvent();
  const { authUser: user } = useAuth();

  useEffect(() => {
    setShowAuthModal(!user);
  }, [user]);

  const uploadFile = async (file: File, prefix: string): Promise<string> => {
    if (!user) throw new Error("User not authenticated");
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error } = await supabase.storage
      .from("event-images")
      .upload(fileName, file);
    if (error) throw error;
    const {
      data: { publicUrl },
    } = supabase.storage.from("event-images").getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (draft = false) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }
    if (!bannerFile) {
      toast.error("Please upload an event banner");
      return;
    }
    if (endDate && !endTime) {
      toast.error("Please add an end time, or clear the end date");
      return;
    }
    if (!endDate && endTime) {
      toast.error("Please add an end date, or clear the end time");
      return;
    }
    if (locationLat === null || locationLng === null) {
      toast.error(
        "Please pick a location from the suggestions so we can place it on the map",
      );
      return;
    }

    const validationResult = eventSchema.safeParse({
      eventName,
      startTime,
      endTime: endTime || "",
      location,
      description,
    });
    if (!validationResult.success) {
      toast.error(validationResult.error.issues[0].message);
      return;
    }

    const tierError = validateTicketTiers(ticketTiers, isPaid);
    if (tierError) {
      toast.error(tierError);
      return;
    }

    if (endDate && endTime) {
      const startDateTime = new Date(startDate);
      const [startH, startM] = startTime.split(":");
      startDateTime.setHours(parseInt(startH, 10), parseInt(startM, 10), 0, 0);
      const endDateTime = new Date(endDate);
      const [endH, endM] = endTime.split(":");
      endDateTime.setHours(parseInt(endH, 10), parseInt(endM, 10), 0, 0);
      if (endDateTime <= startDateTime) {
        toast.error("End date/time must be after start");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      setSubmitStatus("Uploading banner...");
      const backgroundImageUrl = await uploadFile(bannerFile, "event-banner");

      let venueMapPayload: CreateEventPayload["venueMap"] = null;
      if (venueMapFile) {
        setSubmitStatus("Uploading venue map...");
        const imageUrl = await uploadFile(venueMapFile, "venue-map");
        venueMapPayload = { imageUrl };
      }
      const gallery: { mediaUrl: string; mediaType: string }[] = [];
      for (let i = 0; i < galleryItems.length; i++) {
        const item = galleryItems[i];
        if (item.file) {
          setSubmitStatus("Uploading gallery...");
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
        geocodedAddress,
        locationLat,
        locationLng,
        backgroundImageUrl,
        isPaid,
        ageGroup: ageGroup || null,
        genre: genre || null,
        tags: tags.length > 0 ? tags : undefined,
        status: draft ? "draft" : "active",
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
      setSubmitStatus("Creating event...");
      const result = await createEvent.mutateAsync(payload);
      setSubmitStatus("");
      setCreatedEvent({
        status: result.event.status,
        approvalStatus: result.event.approvalStatus,
      });

      setShowSuccessModal(true);

      toast.success(
        draft ? "Event saved as draft!" : "Event created successfully!",
      );
      navigate("/my-events");
    } catch (error) {
      if (import.meta.env.DEV) console.error("Error creating event:", error);
      toast.error(
        getApiErrorMessage(error, "Failed to create event. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Create Event"
        description="Create and publish a new event"
      />
      <AuthSheet
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

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
                    <span className="text-[14px] md:text-[17px] font-medium">
                      Start
                    </span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "px-2 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-left border-r border-black focus:outline-none bg-white",
                          !startDate && "text-[#C4C4C4]",
                        )}
                      >
                        {startDate
                          ? format(startDate, "EEE, dd MMM")
                          : "Thu, 28 Oct"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
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
                    <span className="text-[14px] md:text-[17px] font-medium">
                      End (optional)
                    </span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={cn(
                          "px-2 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-left border-r border-black focus:outline-none bg-white",
                          !endDate && "text-[#C4C4C4]",
                        )}
                      >
                        {endDate ? format(endDate, "EEE, dd MMM") : "None"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <TimePicker
                    value={endTime}
                    onChange={setEndTime}
                    placeholder="16:00"
                  />
                </div>
              </div>

              {/* Location Section */}
              <div className="relative">
                {
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border rounded-none border-black justify-start h-12"
                    onClick={() => setShowMapModal(true)}
                  >
                    <MapPin className="mr-2 h-4 w-4" />

                    {location ? (
                      <span className="truncate">{location}</span>
                    ) : (
                      <span className="text-muted-foreground">
                        Pick event location
                      </span>
                    )}
                  </Button>
                }
              </div>

              {/* Description */}
              <textarea
                placeholder="Add description"
                rows={6}
                className="w-full px-3 md:px-4 py-2 md:py-3 text-[14px] md:text-[17px] text-black border border-black focus:outline-none resize-none placeholder:text-[#C4C4C4]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              {/* Event Metadata */}
              <EventMetadataForm
                ageGroup={ageGroup}
                genre={genre}
                tags={tags}
                onAgeGroupChange={setAgeGroup}
                onGenreChange={setGenre}
                onTagsChange={setTags}
              />

              {/* Ticket Tiers */}
              <EventTicketTiers
                tiers={ticketTiers}
                onChange={setTicketTiers}
                isPaid={isPaid}
                onPaidChange={setIsPaid}
              />

              {/* Banner */}
              <EventBannerUpload
                bannerPreview={bannerPreview}
                onBannerChange={(file, preview) => {
                  setBannerFile(file);
                  setBannerPreview(preview);
                }}
              />

              {/* Gallery */}
              <EventGalleryUpload
                items={galleryItems}
                onChange={setGalleryItems}
              />

              {/* Venue Seating Map (Simplified) */}
              <VenueSeatingMapEditor
                mapImagePreview={venueMapPreview}
                onMapImageChange={(file, preview) => {
                  setVenueMapFile(file);
                  setVenueMapPreview(preview);
                }}
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
                      <span>
                        {isSubmitting
                          ? submitStatus || "Creating..."
                          : "PUBLISH EVENT"}
                      </span>
                    </span>
                  </button>
                  <div className="flex w-[50px] h-[50px] justify-center items-center border absolute right-0 bg-white rounded-[99px] border-solid border-[#1A1A1A] transition-all duration-300 ease-in-out group-hover:opacity-0 group-hover:scale-50 pointer-events-none z-0">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M0.857178 6H10.3929"
                        stroke="#1A1A1A"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M6.39282 10L10.3928 6L6.39282 2"
                        stroke="#1A1A1A"
                        strokeWidth="1.5"
                      />
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

        {/* Location Map Modal */}
        {showMapModal && (
          <LocationMapModal
            onSave={(loc) => {
              setLocationLat(loc.latitude);
              setLocationLng(loc.longitude);
              setLocation(loc.displayAddress || loc.geocodedAddress);
              setGeocodedAddress(loc.geocodedAddress || null);
              setShowMapModal(false);
              toast.success("Location selected successfully");
            }}
            onClose={() => setShowMapModal(false)}
          />
        )}
      </div>

      <EventCreatedModal
        open={showSuccessModal}
        onOpenChange={setShowSuccessModal}
        status={createdEvent?.status ?? ""}
        approvalStatus={createdEvent?.approvalStatus ?? "pending"}
        onViewEvents={() => {
          setShowSuccessModal(false);
          navigate("/my-events");
        }}
      />
    </>
  );
};

export default CreateEvent;
