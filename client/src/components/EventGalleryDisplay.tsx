import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';

interface GalleryItem {
  id: string;
  media_url: string;
  media_type: string;
}

interface EventGalleryDisplayProps {
  eventId: string;
}

export const EventGalleryDisplay: React.FC<EventGalleryDisplayProps> = ({ eventId }) => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchGallery = async () => {
      const { data } = await supabase
        .from('event_gallery')
        .select('id, media_url, media_type')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });
      if (data) setItems(data);
    };
    fetchGallery();
  }, [eventId]);

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col items-start gap-4 self-stretch relative">
      <div className="flex flex-col items-start gap-5 self-stretch">
        <hr className="h-px self-stretch bg-[#1A1A1A] border-0" />
        <h2 className="text-[#1A1A1A] text-[11px] font-normal uppercase">GALLERY</h2>
      </div>
      <div className="grid grid-cols-3 gap-2 self-stretch">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="aspect-square overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setSelectedIndex(index)}
          >
            {item.media_type === 'video' ? (
              <video src={item.media_url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={item.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-[5000] bg-black/90 flex items-center justify-center" onClick={() => setSelectedIndex(null)}>
          <button className="absolute top-6 right-6 text-white z-10" onClick={() => setSelectedIndex(null)}>
            <X className="w-6 h-6" />
          </button>
          <div className="max-w-4xl max-h-[90vh] w-full px-4" onClick={(e) => e.stopPropagation()}>
            {items[selectedIndex].media_type === 'video' ? (
              <video src={items[selectedIndex].media_url} controls className="w-full max-h-[80vh] object-contain" />
            ) : (
              <img src={items[selectedIndex].media_url} alt="" className="w-full max-h-[80vh] object-contain" />
            )}
          </div>
        </div>
      )}
    </section>
  );
};
