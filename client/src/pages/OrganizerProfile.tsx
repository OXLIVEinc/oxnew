import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/Navbar';
import { SEOHead } from '@/components/SEOHead';
import { AuthSheet } from '@/components/AuthSheet';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface OrganizerProfileData {
  id: string;
  user_id: string;
  brand_name: string;
  bio: string | null;
  profile_photo_url: string | null;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
}

interface EventItem {
  id: string;
  title: string;
  date: string;
  background_image_url: string;
  address: string;
}

const OrganizerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<OrganizerProfileData | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  useEffect(() => {
    if (profile && userId) checkFollowing();
  }, [profile, userId]);

  const fetchProfile = async () => {
    const { data: profileData } = await supabase
      .from('organizer_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (!profileData) {
      setLoading(false);
      return;
    }

    setProfile(profileData);

    // Fetch events by this organizer
    const { data: eventsData } = await supabase
      .from('events')
      .select('id, title, date, background_image_url, address')
      .eq('created_by', profileData.user_id)
      .eq('status', 'active')
      .order('target_date', { ascending: false });

    setEvents(eventsData || []);

    // Fetch follower count
    const { count } = await supabase
      .from('organizer_follows')
      .select('*', { count: 'exact', head: true })
      .eq('organizer_id', profileData.id);

    setFollowerCount(count || 0);
    setLoading(false);
  };

  const checkFollowing = async () => {
    if (!userId || !profile) return;
    const { data } = await supabase
      .from('organizer_follows')
      .select('id')
      .eq('organizer_id', profile.id)
      .eq('follower_id', userId)
      .maybeSingle();
    setIsFollowing(!!data);
  };

  const toggleFollow = async () => {
    if (!userId) {
      setIsAuthOpen(true);
      return;
    }
    if (!profile) return;

    if (isFollowing) {
      await supabase.from('organizer_follows').delete().eq('organizer_id', profile.id).eq('follower_id', userId);
      setIsFollowing(false);
      setFollowerCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('organizer_follows').insert({ organizer_id: profile.id, follower_id: userId });
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex h-screen items-center justify-center">
          <div className="text-[#1A1A1A] text-2xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex flex-col h-screen items-center justify-center">
          <h1 className="text-4xl font-medium mb-4">Profile Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title={profile.brand_name} description={profile.bio || `${profile.brand_name} organizer profile`} />
      <Navbar />
      <AuthSheet isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <div className="min-h-screen bg-white pt-24 md:pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-2 border-[#1A1A1A] flex-shrink-0">
              {profile.profile_photo_url ? (
                <img src={profile.profile_photo_url} alt={profile.brand_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#FA76FF] flex items-center justify-center text-white text-3xl font-medium">
                  {profile.brand_name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl md:text-4xl font-medium mb-2">{profile.brand_name}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-4 mb-4 text-[14px] text-gray-600">
                <span><strong>{events.length}</strong> events</span>
                <span><strong>{followerCount}</strong> followers</span>
              </div>
              {profile.bio && <p className="text-[15px] text-[#1A1A1A] leading-relaxed mb-4">{profile.bio}</p>}
              
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <button
                  onClick={toggleFollow}
                  className={`px-6 py-2.5 text-[13px] uppercase font-medium border transition-colors ${
                    isFollowing
                      ? 'border-[#1A1A1A] bg-white text-[#1A1A1A] hover:bg-gray-50'
                      : 'border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-[#FA76FF] hover:border-[#FA76FF] hover:text-black'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                {profile.instagram && (
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="text-[11px] uppercase border border-black px-3 h-[34px] flex items-center hover:bg-gray-50">
                    Instagram
                  </a>
                )}
                {profile.twitter && (
                  <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" className="text-[11px] uppercase border border-black px-3 h-[34px] flex items-center hover:bg-gray-50">
                    Twitter
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Events Grid */}
          <div className="flex flex-col items-start gap-5 mb-6">
            <hr className="h-px self-stretch bg-[#1A1A1A] border-0" />
            <h2 className="text-[#1A1A1A] text-[11px] font-normal uppercase">EVENTS</h2>
          </div>
          
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No events yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/event/${event.id}`)}
                >
                  <div className="overflow-hidden mb-3">
                    <div
                      className="aspect-square bg-gray-300 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url(${event.background_image_url})` }}
                    />
                  </div>
                  <h3 className="text-lg font-medium">{event.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{event.address}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default OrganizerProfile;
