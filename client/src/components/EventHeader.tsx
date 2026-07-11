import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface EventHeaderProps {
  title: string;
  creator: string;
  creatorUserId?: string;
}

export const EventHeader: React.FC<EventHeaderProps> = ({ title, creator, creatorUserId }) => {
  const navigate = useNavigate();
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (creatorUserId) {
      supabase
        .from('organizer_profiles')
        .select('id')
        .eq('user_id', creatorUserId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setProfileId(data.id);
        });
    }
  }, [creatorUserId]);

  return (
    <div className="flex flex-col items-start gap-4 self-stretch relative">
      <header>
        <h1 className="self-stretch text-[#1A1A1A] text-[56px] font-medium leading-[54.88px] tracking-[-2.24px] relative max-md:text-[42px] max-md:leading-[38px] max-md:tracking-[-1.68px] max-sm:text-[32px] max-sm:leading-[30px] max-sm:tracking-[-1.28px]">
          {title}
        </h1>
      </header>
      <div
        className={`self-stretch text-[#1A1A1A] text-[11px] font-normal uppercase relative ${profileId ? 'cursor-pointer hover:text-[#FA76FF] transition-colors' : ''}`}
        onClick={() => profileId && navigate(`/organizer/${profileId}`)}
      >
        BY {creator}
      </div>
    </div>
  );
};
