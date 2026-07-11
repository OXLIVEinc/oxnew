import React, { useState } from 'react';
import { X } from 'lucide-react';

const AGE_GROUPS = ['All Ages', '18+', '21+', '16+', 'Family Friendly'];
const GENRES = ['Music', 'Art', 'Tech', 'Food & Drink', 'Sports', 'Nightlife', 'Business', 'Comedy', 'Festival', 'Wellness', 'Education', 'Networking'];

interface EventMetadataFormProps {
  ageGroup: string;
  genre: string;
  tags: string[];
  onAgeGroupChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
}

export const EventMetadataForm: React.FC<EventMetadataFormProps> = ({
  ageGroup,
  genre,
  tags,
  onAgeGroupChange,
  onGenreChange,
  onTagsChange,
}) => {
  const [tagInput, setTagInput] = useState('');

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      onTagsChange([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-5 self-stretch">
        <hr className="h-px self-stretch bg-[#1A1A1A] border-0" />
        <h3 className="text-[#1A1A1A] text-[11px] font-normal uppercase">EVENT DETAILS</h3>
      </div>

      {/* Age Group */}
      <div>
        <label className="text-[11px] uppercase text-[#1A1A1A] mb-2 block font-medium">Age Group</label>
        <div className="flex flex-wrap gap-2">
          {AGE_GROUPS.map((ag) => (
            <button
              key={ag}
              type="button"
              onClick={() => onAgeGroupChange(ageGroup === ag ? '' : ag)}
              className={`px-3 py-1.5 text-[12px] uppercase border border-black transition-colors ${
                ageGroup === ag ? 'bg-[#1A1A1A] text-white' : 'bg-white text-black hover:bg-gray-50'
              }`}
            >
              {ag}
            </button>
          ))}
        </div>
      </div>

      {/* Genre */}
      <div>
        <label className="text-[11px] uppercase text-[#1A1A1A] mb-2 block font-medium">Genre / Category</label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onGenreChange(genre === g ? '' : g)}
              className={`px-3 py-1.5 text-[12px] uppercase border border-black transition-colors ${
                genre === g ? 'bg-[#1A1A1A] text-white' : 'bg-white text-black hover:bg-gray-50'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="text-[11px] uppercase text-[#1A1A1A] mb-2 block font-medium">Tags (up to 10)</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag and press Enter"
            className="flex-1 px-3 py-2.5 text-[14px] border border-black focus:outline-none placeholder:text-[#C4C4C4]"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2.5 text-[13px] uppercase font-medium border border-black bg-[#1A1A1A] text-white hover:bg-[#FA76FF] hover:text-black transition-colors"
          >
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-3 py-1 text-[12px] uppercase bg-[#FA76FF]/10 border border-[#FA76FF] text-[#1A1A1A]"
              >
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
