import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { type OrganizerProfile } from '@shared/schema';

interface EventHeaderProps {
  title: string;
  creatorUserId?: string;
}

export const EventHeader: React.FC<EventHeaderProps> = ({
  title,
  creatorUserId,
}) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<OrganizerProfile | null>(null);

  useEffect(() => {
    if (!creatorUserId) return;

    supabase
      .from('organizer_profiles')
      .select('*')
      .eq('user_id', creatorUserId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;

        setProfile({
          id: data.id,
          userId: data.user_id,
          brandName: data.brand_name,
          bio: data.bio,
          profilePhotoUrl: data.profile_photo_url,
          website: data.website,
          instagram: data.instagram,
          twitter: data.twitter,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        });
      });
  }, [creatorUserId]);

  return (
    <div className="flex flex-col items-start gap-4 self-stretch relative">
      <header>
        <h1 className="self-stretch text-[#1A1A1A] text-[56px] font-medium leading-[54.88px] tracking-[-2.24px] relative max-md:text-[42px] max-md:leading-[38px] max-md:tracking-[-1.68px] max-sm:text-[32px] max-sm:leading-[30px] max-sm:tracking-[-1.28px]">
          {title}
        </h1>
      </header>

      <div
        className={`self-stretch text-[#1A1A1A] text-[11px] font-normal uppercase relative ${
          profile ? 'cursor-pointer hover:text-[#FA76FF] transition-colors' : ''
        }`}
        onClick={() => profile && navigate(`/organizer/${profile.id}`)}
      >
        BY {profile?.brandName}
      </div>
    </div>
  );
};