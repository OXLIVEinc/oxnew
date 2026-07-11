import React from 'react';

interface EventTagsDisplayProps {
  ageGroup?: string | null;
  genre?: string | null;
  tags?: string[] | null;
}

export const EventTagsDisplay: React.FC<EventTagsDisplayProps> = ({ ageGroup, genre, tags }) => {
  const hasContent = ageGroup || genre || (tags && tags.length > 0);
  if (!hasContent) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {ageGroup && (
        <span className="px-2 h-[24px] flex items-center text-[11px] uppercase font-normal border border-[#1A1A1A] bg-white text-[#1A1A1A]">
          {ageGroup}
        </span>
      )}
      {genre && (
        <span className="px-2 h-[24px] flex items-center text-[11px] uppercase font-normal bg-[#FA76FF]/15 border border-[#FA76FF] text-[#1A1A1A]">
          {genre}
        </span>
      )}
      {tags?.map((tag) => (
        <span
          key={tag}
          className="px-2 h-[24px] flex items-center text-[11px] uppercase font-normal border border-[#1A1A1A]/30 text-[#1A1A1A]/70"
        >
          {tag}
        </span>
      ))}
    </div>
  );
};
