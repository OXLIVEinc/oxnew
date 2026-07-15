import React, { useRef } from 'react';
import { toast } from 'sonner';
import { ImageIcon } from 'lucide-react';

interface VenueSeatingMapEditorProps {
  mapImagePreview: string | null;
  onMapImageChange: (file: File, preview: string) => void;
}

export const VenueSeatingMapEditor: React.FC<VenueSeatingMapEditorProps> = ({
  mapImagePreview,
  onMapImageChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-5 self-stretch">
        <hr className="h-px self-stretch bg-[#1A1A1A] border-0" />
        <h3 className="text-[#1A1A1A] text-[11px] font-normal uppercase">VENUE SEATING MAP</h3>
      </div>

      {/* Map Image Upload */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-4 h-4" />
          <span className="text-[11px] uppercase font-medium">Venue Layout Image</span>
        </div>
        <p className="text-[11px] text-gray-500 mb-2">Upload your venue's seating layout (JPG/PNG/WebP)</p>
        
        <label className="w-full aspect-video border border-dashed border-black bg-[#F5F5F5] flex items-center justify-center cursor-pointer hover:bg-[#ECECEC] transition-colors overflow-hidden relative">
          {mapImagePreview ? (
            <img 
              src={mapImagePreview} 
              alt="Venue seating map" 
              className="w-full h-full object-contain" 
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8 text-[#999]" />
              <span className="text-[11px] uppercase text-[#999]">Upload Venue Layout</span>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
        </label>
      </div>
    </div>
  );
};