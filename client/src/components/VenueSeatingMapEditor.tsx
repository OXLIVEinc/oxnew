import React, { useRef, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ImageIcon, Upload, X, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VenueSeatingMapEditorProps {
  eventId?: string;
  mapImagePreview: string | null;
  onMapImageChange: (file: File | null, preview: string | null) => void;
}

export const VenueSeatingMapEditor: React.FC<VenueSeatingMapEditorProps> = ({
  eventId,
  mapImagePreview,
  onMapImageChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [existingMapUrl, setExistingMapUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch existing venue map from the database
  useEffect(() => {
    const fetchVenueMap = async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }

      try {
        const { data: venueMap } = await supabase
          .from('venue_maps')
          .select('image_url')
          .eq('event_id', eventId)
          .maybeSingle();

        if (venueMap?.image_url) {
          setExistingMapUrl(venueMap.image_url);
        } else {
          setExistingMapUrl(null);
        }
      } catch (error) {
        console.error('Error fetching venue map:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenueMap();
  }, [eventId]);

  // Reset existingMapUrl when mapImagePreview is explicitly set to null (meaning removal)
  useEffect(() => {
    if (mapImagePreview === null && existingMapUrl) {
      setExistingMapUrl(null);
    }
  }, [mapImagePreview]);

  // Determine which image to show (preview takes precedence over existing)
  const displayImage = mapImagePreview || existingMapUrl;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WebP image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => onMapImageChange(file, reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onMapImageChange(null, null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-start gap-5 self-stretch">
          <hr className="h-px self-stretch bg-[#1A1A1A] border-0" />
          <h3 className="text-[#1A1A1A] text-[11px] font-normal uppercase">VENUE SEATING MAP</h3>
        </div>
        <div className="w-full aspect-video bg-gray-100 animate-pulse flex items-center justify-center">
          <span className="text-gray-400 text-sm">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-5 self-stretch">
        <hr className="h-px self-stretch bg-[#1A1A1A] border-0" />
        <div className="flex items-center justify-between w-full">
          <h3 className="text-[#1A1A1A] text-[11px] font-normal uppercase">VENUE SEATING MAP</h3>
          {displayImage && (
            <span className="text-[11px] text-green-600 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-600 rounded-full inline-block"></span>
              Uploaded
            </span>
          )}
        </div>
      </div>

      {/* Map Image Display/Upload */}
      <div>
        <p className="text-[11px] text-gray-500 mb-2">
          {displayImage 
            ? 'Current venue layout image. Hover to change or remove.' 
            : 'Upload your venue\'s seating layout (JPG/PNG/WebP)'
          }
        </p>
        
        <div 
          className="relative w-full aspect-video border border-dashed border-black bg-[#F5F5F5] overflow-hidden"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {displayImage ? (
            <>
              <img 
                src={displayImage} 
                alt="Venue seating map" 
                className="w-full h-full object-cover"
              />
              
              {/* Overlay on hover */}
              <div 
                className={`absolute inset-0 bg-black/60 flex items-center justify-center gap-3 transition-opacity duration-200 ${
                  isHovering ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <button
                  type="button"
                  className="bg-white hover:bg-gray-100 text-black px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2"
                  onClick={() => inputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Change
                </button>
                <button
                  type="button"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2"
                  onClick={handleRemove}
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              </div>

              {/* Info badge - shows if it's existing or new */}
              <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {mapImagePreview ? 'Preview - Not Saved' : 'Existing Map'}
              </div>

              {/* Shows if this is the existing map from DB */}
              {!mapImagePreview && existingMapUrl && (
                <div className="absolute bottom-2 left-2 bg-blue-600/80 text-white text-[10px] px-2 py-1 rounded">
                  Currently on event page
                </div>
              )}
            </>
          ) : (
            <label 
              className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-[#ECECEC] transition-colors"
            >
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="w-8 h-8 text-[#999]" />
                <span className="text-[11px] uppercase text-[#999]">Upload Venue Layout</span>
                <span className="text-[9px] text-[#999]">JPG, PNG, WebP • Max 5MB</span>
              </div>
            </label>
          )}
          
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {/* Helpful info when map exists */}
        {displayImage && (
          <div className="mt-2 flex items-start gap-2 text-[10px] text-gray-500">
            <Eye className="w-3 h-3 flex-shrink-0 mt-0.5" />
            <span>
              {mapImagePreview 
                ? 'New map uploaded. Save the event to update it.' 
                : 'This map is currently displayed on your event page. Upload a new one to replace it.'
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
};