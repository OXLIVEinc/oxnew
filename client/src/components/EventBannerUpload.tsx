import React, { useRef } from 'react';
import { toast } from 'sonner';
import { ImageIcon } from 'lucide-react';

interface EventBannerUploadProps {
  bannerPreview: string | null;
  onBannerChange: (file: File, preview: string) => void;
}

export const EventBannerUpload: React.FC<EventBannerUploadProps> = ({
  bannerPreview,
  onBannerChange,
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
    reader.onloadend = () => onBannerChange(file, reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-5 self-stretch">
        <hr className="h-px self-stretch bg-[#1A1A1A] border-0" />
        <h3 className="text-[#1A1A1A] text-[11px] font-normal uppercase">EVENT BANNER</h3>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-4 h-4" />
          <span className="text-[11px] uppercase font-medium">Event Banner (16:9)</span>
        </div>
        <p className="text-[11px] text-gray-500 mb-2">
          Recommended: 1920 × 1080px — This image will appear everywhere on the platform
        </p>

        {/* Main Upload Area - 16:9 */}
        <label className="w-full aspect-video border border-dashed border-black bg-[#F5F5F5] flex items-center justify-center cursor-pointer hover:bg-[#ECECEC] transition-colors overflow-hidden relative">
          {bannerPreview ? (
            <img 
              src={bannerPreview} 
              alt="Event banner" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8 text-[#999]" />
              <span className="text-[11px] uppercase text-[#999]">Upload Event Banner</span>
              <span className="text-[10px] text-[#BBB]">16:9 aspect ratio recommended</span>
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

        {/* Discovery Page Preview - Also 16:9 */}
        {bannerPreview && (
          <div className="mt-6">
            <p className="text-[11px] text-gray-500 mb-2 uppercase">Preview — How it will appear on Discovery</p>
            <div className="max-w-sm">
              <div className="aspect-video rounded-lg overflow-hidden bg-muted border border-border shadow-sm">
                <img 
                  src={bannerPreview} 
                  alt="Discovery preview" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <div className="mt-2 px-1">
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-2 bg-gray-100 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};