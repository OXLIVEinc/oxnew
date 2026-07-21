import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useFeaturedEvents } from '@/hooks/api/useDiscover';
import { formatEventSchedule } from '@/lib/eventSchedule';
import { Skeleton } from "@/components/ui/skeleton";

const STORY_DURATION = 5000;

/**
 * src/components/FeaturedStoriesCarousel.tsx
 * -------------------------------------------------------------------------
 * "Featured Events" — admin-curated only (events.isFeatured), via
 * GET /api/discover/featured. Previously this showed ANY upcoming active
 * event, which made "Featured" meaningless; it's now exactly what an admin
 * chose to spotlight.
 * -------------------------------------------------------------------------
 */



const FeaturedStoriesCarouselSkeleton = () => (
  <div className="w-full py-8 md:py-12 bg-background">
    {/* Header */}
    <div className="flex items-center justify-between px-4 md:px-8 mb-4 md:mb-6">
      <Skeleton className="h-7 w-44" />
      <Skeleton className="h-4 w-16" />
    </div>

    {/* Full-width banner */}
    <div className="px-4 md:px-8">
      <div className="relative w-full h-[260px] sm:h-[360px] md:h-[520px] rounded-xl overflow-hidden">
        <Skeleton className="w-full h-full rounded-xl" />

        {/* Progress bars */}
        <div className="absolute top-3 left-3 right-3 flex gap-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[2px] flex-1" />
          ))}
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          <Skeleton className="h-8 w-2/3 max-w-md" />
          <Skeleton className="h-4 w-1/2 max-w-xs" />

          <div className="flex gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>

          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>

    {/* Thumbnails */}
    <div className="flex gap-4 px-4 md:px-8 mt-4 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-2 shrink-0">
          <Skeleton className="w-14 h-14 md:w-16 md:h-16 rounded-full" />
          <Skeleton className="h-2 w-10" />
        </div>
      ))}
    </div>
  </div>
);


export const FeaturedStoriesCarousel: React.FC = () => {
  const { data: events = [], isLoading } = useFeaturedEvents();
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<number>(0);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldingRef = useRef(false);
  const navigate = useNavigate();

  const goTo = useCallback((index: number) => {
    // Cancel any running animation frame
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    setActiveIndex(index);
    setProgress(0);
    elapsedRef.current = 0;
  }, []);

  const goNext = useCallback(() => {
    goTo((activeIndex + 1) % events.length);
  }, [activeIndex, events.length, goTo]);

  const goPrev = useCallback(() => {
    goTo((activeIndex - 1 + events.length) % events.length);
  }, [activeIndex, events.length, goTo]);

  // Single animation loop — runs when not paused and events exist
  useEffect(() => {
    if (events.length === 0 || isPaused) return;

    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current);
      const pct = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        // Move to next slide
        elapsedRef.current = 0;
        setActiveIndex(prev => (prev + 1) % events.length);
        setProgress(0);
        startTimeRef.current = Date.now();
        timerRef.current = requestAnimationFrame(animate);
        return;
      }

      timerRef.current = requestAnimationFrame(animate);
    };

    timerRef.current = requestAnimationFrame(animate);

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
        timerRef.current = null;
      }
      // Save elapsed time when pausing or unmounting
      elapsedRef.current += Date.now() - startTimeRef.current;
    };
  }, [isPaused, events.length]);

  const pauseSlider = useCallback(() => {
    if (!isPaused) {
      elapsedRef.current += Date.now() - startTimeRef.current;
      setIsPaused(true);
    }
  }, [isPaused]);

  const resumeSlider = useCallback(() => {
    if (isPaused) setIsPaused(false);
  }, [isPaused]);

  const togglePause = () => setIsPaused(prev => !prev);

  // Touch swipe
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) { diff > 0 ? goPrev() : goNext(); }
  };

  // Click & hold
  const handlePointerDown = () => {
    isHoldingRef.current = false;
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      pauseSlider();
    }, 200);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      resumeSlider();
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) goPrev();
    else goNext();
  };

  const handlePointerLeave = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      resumeSlider();
    }
  };

  if (isLoading) {
  return <FeaturedStoriesCarouselSkeleton />;
}

if (events.length === 0) return null;

  const current = events[activeIndex];

  return (
    <div className="w-full py-8 md:py-12 bg-background">
      <div className="flex items-center justify-between px-4 md:px-8 mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold">Featured Events</h2>
        <button
          onClick={() => document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="text-[11px] uppercase font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          See All →
        </button>
      </div>

      <div className="px-4 md:px-8">
        <div
          className="relative w-full aspect-[16/9] md:aspect-[16/7] max-h-[75vh] overflow-hidden cursor-pointer group rounded-xl select-none"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            key={current.id}
            src={current.backgroundImageUrl}
            alt={current.title}
            className="absolute inset-0 w-full h-full object-cover animate-fade-in"
            style={{ animationDuration: '0.3s' }}
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

          {/* Progress bars */}
          <div className="absolute top-3 left-3 right-3 flex gap-1 z-20">
            {events.map((_, i) => (
              <div key={i} className="flex-1 h-[2px] bg-white/30 overflow-hidden rounded-full">
                <div
                  className="h-full bg-white transition-none"
                  style={{ width: i < activeIndex ? '100%' : i === activeIndex ? `${progress}%` : '0%' }}
                />
              </div>
            ))}
          </div>

          {/* Pause button */}
          <button
            onClick={(e) => { e.stopPropagation(); togglePause(); }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="absolute top-8 right-4 z-20 text-white/80 hover:text-white transition-colors"
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </button>

          {/* Desktop arrows */}
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-10 h-10 items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-10 h-10 items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={20} />
          </button>

          {/* Event info */}
          <div
            className="absolute bottom-0 left-0 right-0 p-5 md:p-8 text-white z-20"
            onClick={(e) => { e.stopPropagation(); navigate(`/event/${current.id}`); }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl md:text-3xl font-semibold mb-1 tracking-tight">{current.title}</h3>
            <p className="text-sm md:text-base text-white/80 truncate">{current.address}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] uppercase bg-white text-black px-2 py-0.5 font-medium">{formatEventSchedule(current.schedule).dateLabel}</span>
              <span className="text-[10px] uppercase border border-white text-white px-2 py-0.5">{formatEventSchedule(current.schedule).timeLabel}</span>
            </div>
            <button className="mt-4 bg-[hsl(300,100%,73%)] text-foreground px-6 py-2.5 text-[12px] uppercase font-semibold hover:bg-white hover:text-black transition-colors rounded-sm">
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Circle thumbnails */}
      <div className="flex gap-3 md:gap-4 px-4 md:px-8 mt-4 overflow-x-auto scrollbar-hide pb-2">
        {events.map((evt, i) => (
          <button
            key={evt.id}
            onClick={() => goTo(i)}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden border-2 transition-all ${
              i === activeIndex
                ? 'border-[hsl(300,100%,73%)] ring-2 ring-[hsl(300,100%,73%)]/30 scale-110'
                : 'border-border opacity-60 hover:opacity-100'
            }`}>
              <img src={evt.backgroundImageUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-[9px] text-muted-foreground truncate max-w-[56px]">{evt.title.split(' ')[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
