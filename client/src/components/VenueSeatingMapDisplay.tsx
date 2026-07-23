import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGeoLocation } from '@/hooks/useGeoLocation';

interface TicketTier {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  is_sold_out?: boolean;
}

interface VenueSection {
  id: string;
  name: string;
  color: string;
  capacity: number;
  ticket_tier_id: string | null;
  sort_order: number;
}

interface VenueSeatingMapDisplayProps {
  eventId: string;
  ticketTiers: TicketTier[];
  selectedTierId: string | null;
  onSelectTier: (tierId: string) => void;
}

export const VenueSeatingMapDisplay: React.FC<VenueSeatingMapDisplayProps> = ({
  eventId,
  ticketTiers,
  selectedTierId,
  onSelectTier,
}) => {
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [sections, setSections] = useState<VenueSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: venueMap } = await supabase
        .from('venue_maps')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle();

      if (venueMap) {
        setMapImageUrl(venueMap.image_url);
        const { data: secs } = await supabase
          .from('venue_sections')
          .select('*')
          .eq('venue_map_id', venueMap.id)
          .order('sort_order', { ascending: true });
        if (secs) setSections(secs);
      }
      setLoading(false);
    };
    fetchData();
  }, [eventId]);

  if (loading || (!mapImageUrl && sections.length === 0)) return null;

  const getTierForSection = (tierId: string | null) => {
    if (!tierId) return null;
    return ticketTiers.find((t) => t.id === tierId) || null;
  };

  return (
    <section className="flex flex-col items-start gap-4 self-stretch">
      <div className="flex flex-col items-start gap-5 self-stretch">
        <hr className="h-px self-stretch bg-[#1A1A1A] border-0" />
        <h2 className="text-[#1A1A1A] text-[11px] font-normal uppercase">VENUE MAP</h2>
      </div>

      {mapImageUrl && (
        <div className="w-full border border-gray-200 overflow-hidden">
          <img
            src={mapImageUrl}
            alt="Venue seating map"
            className="w-full h-auto object-contain"
          />
        </div>
      )}

      {sections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 self-stretch">
          {sections.map((section) => {
            const tier = getTierForSection(section.ticket_tier_id);
            const available = tier ? tier.quantity - tier.sold : section.capacity;
            const soldOut = tier ? (tier.is_sold_out || available <= 0) : false;
            const isSelected = tier && selectedTierId === tier.id;

            return (
              <button
                key={section.id}
                onClick={() => {
                  if (!soldOut && tier) onSelectTier(tier.id);
                }}
                disabled={soldOut || !tier}
                className={`flex flex-col p-3 border transition-all text-left ${
                  isSelected
                    ? 'border-[#FA76FF] bg-[#FA76FF]/5'
                    : soldOut
                    ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-[#1A1A1A] hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: soldOut ? '#d1d5db' : section.color }}
                  />
                  <span className="text-[13px] font-medium truncate">{section.name}</span>
                </div>
                {tier && (
                  <div className="text-[12px] text-gray-500">
                    {tier.price > 0 ? `₦${tier.price.toFixed(2)}` : 'Free'}
                  </div>
                )}
                <div className={`text-[10px] uppercase mt-0.5 ${soldOut ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {soldOut ? 'Sold out' : `${available} left`}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
