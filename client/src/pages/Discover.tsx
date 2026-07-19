// src/pages/Discover.tsx
import React, { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { FeaturedStoriesCarousel } from "@/components/FeaturedStoriesCarousel";
import { TrustedByMarquee } from "@/components/TrustedByMarquee";
import { EventMarketplace } from "@/components/EventMarketplace";
import {
  DiscoverFilterBar,
  DEFAULT_FILTERS,
  type DiscoverFilters,
} from "@/components/discover/DiscoverFilterBar";
import { DiscoverEventCard } from "@/components/discover/DiscoverEventCard";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { useEvents } from "@/hooks/api/useEvents";
import {
  addDays,
  isSameDay,
  isWithinInterval,
  isWeekend,
  startOfDay,
  endOfDay,
} from "date-fns";
import { SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import { EventFooter } from "@/components/EventFooter";

const TYPEWRITER_PHRASES = [
  "Built to Empower Events.",
  "Where Every Moment Counts.",
  "Your Events, Amplified.",
];

const TypewriterText: React.FC = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    const phrase = TYPEWRITER_PHRASES[phraseIndex];
    const speed = deleting ? 30 : 60;
    const pauseEnd = 2000;

    const timer = setTimeout(() => {
      if (!deleting && charIndex < phrase.length) {
        setDisplayText(phrase.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      } else if (!deleting && charIndex === phrase.length) {
        setTimeout(() => setDeleting(true), pauseEnd);
      } else if (deleting && charIndex > 0) {
        setDisplayText(phrase.slice(0, charIndex - 1));
        setCharIndex(charIndex - 1);
      } else if (deleting && charIndex === 0) {
        setDeleting(false);
        setPhraseIndex((phraseIndex + 1) % TYPEWRITER_PHRASES.length);
      }
    }, speed);

    return () => clearTimeout(timer);
  }, [charIndex, deleting, phraseIndex]);

  return (
    <span>
      {displayText}
      <span className="inline-block w-[2px] h-[1em] bg-foreground ml-0.5 animate-pulse align-middle" />
    </span>
  );
};

function matchesDate(eventDate: Date, filters: DiscoverFilters): boolean {
  const today = startOfDay(new Date());

  switch (filters.datePreset) {
    case "any":
      return true;
    case "today":
      return isSameDay(eventDate, today);
    case "tomorrow":
      return isSameDay(eventDate, addDays(today, 1));
    case "week":
      return isWithinInterval(eventDate, {
        start: today,
        end: endOfDay(addDays(today, 6)),
      });
    case "weekend": {
      let cursor = today;
      while (!isWeekend(cursor)) cursor = addDays(cursor, 1);
      const weekendEnd = cursor.getDay() === 6 ? addDays(cursor, 1) : cursor;
      return isWithinInterval(eventDate, {
        start: startOfDay(cursor),
        end: endOfDay(weekendEnd),
      });
    }
    case "custom": {
      if (!filters.customRange?.from) return true;
      const from = startOfDay(filters.customRange.from);
      const to = filters.customRange.to
        ? endOfDay(filters.customRange.to)
        : endOfDay(filters.customRange.from);
      return isWithinInterval(eventDate, { start: from, end: to });
    }
    default:
      return true;
  }
}

const PAGE_SIZE = 20;

const Discover = () => {
  const [filters, setFilters] = useState<DiscoverFilters>(DEFAULT_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [scrollY, setScrollY] = useState(0);

  const geo = useGeoLocation();

  const { data, isLoading: loading, isFetching } = useEvents({
    q: filters.search?.trim() || undefined,
    page: currentPage,
    limit: PAGE_SIZE,
  });

  const events = data?.events ?? [];
  const pagination = data?.pagination;

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Client-side date filtering (can be moved to backend later)
  const filteredEvents = useMemo(() => {
    const now = Date.now();
    const oneHour = 1000 * 60 * 60;

    return events.filter((event) => {
      const eventDateTime = new Date(`${event.schedule.date}T${event.schedule.time}`);
      if (eventDateTime.getTime() < now - oneHour) return false;

      if (!matchesDate(eventDateTime, filters)) return false;

      return true;
    });
  }, [events, filters]);

  const isFiltered = filters.search.trim() !== "" || filters.datePreset !== "any";

  // Scroll handler for hero parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title="Discover Events | OX Entertainment"
        description="Explore popular events near you"
        keywords="events, discover events, community events, OX Entertainment"
      />

      <div className="animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
        <Navbar />
      </div>

      {/* Hero Section */}
      <section className="pt-32 md:pt-40 lg:pt-48 pb-6 md:pb-16 lg:pb-24 px-4 md:px-8 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `translate3d(0, ${scrollY * 0.5}px, 0)` }}
        >
          <div className="absolute top-10 left-[5%] w-48 md:w-96 h-48 md:h-96 rounded-full bg-[hsl(var(--primary))]/[0.04] blur-3xl" />
          <div className="absolute top-32 right-[10%] w-64 md:w-[500px] h-64 md:h-[500px] rounded-full bg-[hsl(300,100%,73%)]/[0.04] blur-3xl" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-10" />

        <div
          className="max-w-4xl mx-auto text-center relative z-20"
          style={{
            transform: `translate3d(0, ${scrollY * -0.15}px, 0)`,
            opacity: Math.max(0, 1 - scrollY / 700),
          }}
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium mb-6 md:mb-10 inline-flex flex-col items-center">
            <div className="flex gap-2 items-center">
              <span className="border border-foreground px-3 md:px-6 py-2 md:py-4 animate-fade-in"
                style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
                Discover
              </span>
              <span className="bg-[hsl(300,100%,73%)] text-foreground border border-foreground px-3 md:px-6 py-2 md:py-4 rounded-[20px] md:rounded-[40px] -ml-px animate-fade-in"
                style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
                events
              </span>
            </div>
            <div className="flex items-center -mt-px">
              <span className="border border-foreground px-3 md:px-6 py-2 md:py-4 animate-fade-in"
                style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
                near
              </span>
              <span className="border border-l-0 border-foreground px-3 md:px-6 py-2 md:py-4 animate-fade-in"
                style={{ animationDelay: "0.6s", animationFillMode: "both" }}>
                you
              </span>
            </div>
          </h1>
          <p className="text-sm md:text-base lg:text-[18px] text-foreground/80 max-w-2xl mx-auto h-7 animate-fade-in"
            style={{ animationDelay: "0.7s", animationFillMode: "both" }}>
            <TypewriterText />
          </p>
        </div>
      </section>

      <TrustedByMarquee />
      <FeaturedStoriesCarousel />
      <EventMarketplace />

      {/* Browse / Filter Section */}
      <section id="events-section" className="px-4 md:px-8 pb-16 pt-6 md:pt-16">
        <div className="flex flex-wrap items-center gap-2 mb-6 md:mb-8 animate-fade-in"
          style={{ animationDelay: "0.8s", animationFillMode: "both" }}>
          <h2 className="text-base md:text-lg lg:text-xl font-normal">
            Browsing events in
          </h2>
          <span className="text-base md:text-lg lg:text-xl font-normal border border-foreground px-2 py-1 rounded-full">
            {geo.country}
          </span>
        </div>

        <DiscoverFilterBar
          filters={filters}
          onChange={setFilters}
          resultCount={pagination?.total ?? 0}
          isFiltered={isFiltered}
          onReset={() => setFilters(DEFAULT_FILTERS)}
        />

        <div className="mt-6 md:mt-8 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
          {loading ? (
            Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="flex h-full flex-col overflow-hidden rounded-xl border border-border animate-pulse">
                <div className="aspect-video bg-muted flex-shrink-0" />
                <div className="flex-1 flex flex-col p-4">
                  <div className="flex justify-between mb-2">
                    <div className="h-4 bg-muted rounded w-4/5" />
                    <div className="h-5 w-12 bg-muted rounded" />
                  </div>
                  <div className="h-3 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-11/12 mb-auto" />
                  <div className="flex justify-between pt-3 border-t border-border mt-auto">
                    <div className="h-3 bg-muted rounded w-32" />
                    <div className="h-7 w-7 bg-muted rounded-full" />
                  </div>
                </div>
              </div>
            ))
          ) : filteredEvents.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center gap-3 py-20 text-center">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
                <SearchX size={22} className="text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No events match your filters</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search or date range
                </p>
              </div>
              {isFiltered && (
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="mt-2 text-sm font-medium border border-foreground px-4 py-2 rounded-full hover:bg-foreground hover:text-background transition-colors"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            filteredEvents.map((event, index) => (
              <div
                key={event.id}
                className="animate-fade-in"
                style={{
                  animationDelay: `${Math.min(index * 0.04, 0.6)}s`,
                  animationFillMode: "both",
                }}
              >
                <DiscoverEventCard event={event} />
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-4">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isFetching}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <ChevronLeft size={18} />
              Previous
            </button>

            <div className="px-6 py-3 rounded-2xl border border-border font-medium">
              Page <span className="text-primary">{currentPage}</span> of {pagination.totalPages}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              disabled={currentPage === pagination.totalPages || isFetching}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              Next
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>

      <EventFooter />
    </div>

  );
};

export default Discover;