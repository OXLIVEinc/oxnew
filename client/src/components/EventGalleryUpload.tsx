import React, { useRef } from "react";
import { toast } from "sonner";
import { Plus, X, Image, Video } from "lucide-react";

export interface GalleryItem {
  file?: File;
  preview: string;
  media_type: "image" | "video";
  media_url?: string;
}

interface EventGalleryUploadProps {
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
}

export const EventGalleryUpload: React.FC<EventGalleryUploadProps> = ({
  items,
  onChange,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    files.forEach((file) => {
      const isImage = file.type.startsWith("image/");
      // const isVideo = file.type.startsWith('video/');

      // if (!isImage && !isVideo) {
      //   toast.error('Please upload images (JPG, PNG, WebP) or videos (MP4, WebM)');
      //   return;
      // }
      if (!isImage) {
        toast.error("Only image files are allowed.");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File must be less than 20MB");
        return;
      }
      if (items.length >= 10) {
        toast.error("Maximum 10 gallery items");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        onChange([
          ...items,
          {
            file,
            preview: reader.result as string,
            // media_type: isVideo ? 'video' : 'image',
            media_type: "image",
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = "";
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-5 self-stretch">
        <hr className="h-px self-stretch bg-[#1A1A1A] border-0" />
        <h3 className="text-[#1A1A1A] text-[11px] font-normal uppercase">
          GALLERY <span className="text-gray-400">(Optional)</span>
        </h3>
      </div>
      {/* <p className="text-[11px] text-gray-500">
        Add up to 10 images or videos. Images: 1080 × 1080px recommended.
        Videos: MP4/WebM, max 20MB.
      </p> */}
      <p className="text-[11px] text-gray-500">
        Add up to 10 images. Recommended size: 1080 × 1080px. Max 20MB each.
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="relative aspect-square border border-black overflow-hidden group"
          >
            {item.media_type === "video" ? (
              <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
            ) : (
              <img
                src={item.preview || item.media_url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        {items.length < 10 && (
          <label className="aspect-square border border-dashed border-black bg-[#F5F5F5] flex flex-col items-center justify-center cursor-pointer hover:bg-[#ECECEC] transition-colors">
            <Plus className="w-5 h-5 mb-1" />
            <span className="text-[10px] uppercase">Add</span>
            {/* <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              multiple
              className="hidden"
              onChange={handleUpload}
            /> */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        )}
      </div>
    </div>
  );
};
