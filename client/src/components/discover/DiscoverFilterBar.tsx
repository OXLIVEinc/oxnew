/**
 * src/components/discover/DiscoverFilterBar.tsx
 * -------------------------------------------------------------------------
 * Discover filtering is now just search + date, both client-side.
 * -------------------------------------------------------------------------
 */
import React, { useState } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

export type DatePreset = 'any' | 'today' | 'tomorrow' | 'weekend' | 'week' | 'custom';

export interface DiscoverFilters {
  search: string;
  datePreset: DatePreset;
  customRange: DateRange | undefined;
}

export const DEFAULT_FILTERS: DiscoverFilters = {
  search: '',
  datePreset: 'any',
  customRange: undefined,
};

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'any', label: 'Any date' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'weekend', label: 'This weekend' },
  { value: 'week', label: 'This week' },
];

interface Props {
  filters: DiscoverFilters;
  onChange: (filters: DiscoverFilters) => void;
  resultCount: number;
  isFiltered: boolean;
  onReset: () => void;
}

function dateButtonLabel(filters: DiscoverFilters): string {
  if (filters.datePreset === 'custom' && filters.customRange?.from) {
    const { from, to } = filters.customRange;
    if (to && !isSameDay(from, to)) return `${format(from, 'MMM d')} – ${format(to, 'MMM d')}`;
    return format(from, 'MMM d, yyyy');
  }
  const preset = DATE_PRESETS.find((p) => p.value === filters.datePreset);
  return preset?.label ?? 'Any date';
}

export const DiscoverFilterBar: React.FC<Props> = ({ filters, onChange, resultCount, isFiltered, onReset }) => {
  const [dateOpen, setDateOpen] = useState(false);

  const set = <K extends keyof DiscoverFilters>(key: K, value: DiscoverFilters[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="sticky max-w-2xl mx-auto top-16 z-30 px-4 md:px-8 py-3 bg-background/80 backdrop-blur-md border-b border-border/60">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-0 rounded-2xl sm:rounded-full border border-border bg-card shadow-sm hover:shadow-md focus-within:shadow-md focus-within:border-foreground/30 transition-shadow p-1.5">
          <div className="flex items-center gap-2 flex-1 min-w-0 px-3 py-2">
            <Search size={16} className="text-muted-foreground shrink-0" />
            <input
              value={filters.search}
              onChange={(e) => set('search', e.target.value)}
              placeholder="Search events, venues, or locations"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {filters.search && (
              <button onClick={() => set('search', '')} className="text-muted-foreground hover:text-foreground shrink-0">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="hidden sm:block w-px h-6 bg-border shrink-0" />

          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full sm:rounded-none text-sm font-medium shrink-0 hover:bg-muted/60 transition-colors whitespace-nowrap',
                  filters.datePreset !== 'any' ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {dateButtonLabel(filters)}
                <ChevronDown size={14} className="opacity-60" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex flex-col sm:flex-row">
                <div className="flex sm:flex-col gap-1 p-2 border-b sm:border-b-0 sm:border-r border-border overflow-x-auto sm:min-w-[140px]">
                  {DATE_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => {
                        set('datePreset', p.value);
                        set('customRange', undefined);
                        if (p.value !== 'custom') setDateOpen(false);
                      }}
                      className={cn(
                        'text-left text-sm px-3 py-2 rounded-lg whitespace-nowrap transition-colors',
                        filters.datePreset === p.value ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="p-1">
                  <Calendar
                    mode="range"
                    numberOfMonths={1}
                    selected={filters.customRange}
                    onSelect={(range) => {
                      set('customRange', range);
                      set('datePreset', 'custom');
                    }}
                    className="pointer-events-auto"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {isFiltered && (
          <button
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium border border-border hover:bg-muted transition-colors shrink-0"
          >
            <X size={14} />
            Reset filters
          </button>
        )}
      </div>

      {isFiltered && (
        <p className="text-xs text-muted-foreground mt-2 px-1">
          {resultCount} {resultCount === 1 ? 'event' : 'events'} found
        </p>
      )}
    </div>
  );
};