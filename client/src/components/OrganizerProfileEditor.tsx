import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Camera } from 'lucide-react';

interface OrganizerProfileEditorProps {
  userId: string;
}

export const OrganizerProfileEditor: React.FC<OrganizerProfileEditorProps> = ({ userId }) => {
  const [profile, setProfile] = useState({
    brand_name: '',
    bio: '',
    profile_photo_url: '',
    website: '',
    instagram: '',
    twitter: '',
  });
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('organizer_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setProfileId(data.id);
      setProfile({
        brand_name: data.brand_name || '',
        bio: data.bio || '',
        profile_photo_url: data.profile_photo_url || '',
        website: data.website || '',
        instagram: data.instagram || '',
        twitter: data.twitter || '',
      });
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/organizer-profile-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(fileName, file);

    if (uploadError) {
      toast.error('Failed to upload photo');
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(fileName);

    setProfile((p) => ({ ...p, profile_photo_url: publicUrl }));
    toast.success('Photo uploaded!');
  };

  const handleSave = async () => {
    if (!profile.brand_name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    setSaving(true);
    try {
      if (profileId) {
        const { error } = await supabase
          .from('organizer_profiles')
          .update(profile)
          .eq('id', profileId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('organizer_profiles')
          .insert({ ...profile, user_id: userId })
          .select('id')
          .single();
        if (error) throw error;
        setProfileId(data.id);
      }
      toast.success('Profile saved!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Loading profile...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-medium">Brand Profile</h2>

      {/* Profile Photo */}
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-full overflow-hidden border-2 border-[#1A1A1A] cursor-pointer relative group"
          onClick={() => fileRef.current?.click()}
        >
          {profile.profile_photo_url ? (
            <img src={profile.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-[#FA76FF] flex items-center justify-center text-white text-2xl font-medium">
              {profile.brand_name.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-5 h-5 text-white" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        <span className="text-[12px] text-gray-500 uppercase">Click to change photo</span>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <label className="text-[11px] uppercase font-medium text-[#1A1A1A] mb-1 block">Brand Name *</label>
          <input
            type="text"
            value={profile.brand_name}
            onChange={(e) => setProfile((p) => ({ ...p, brand_name: e.target.value }))}
            className="w-full px-4 py-3 text-[14px] border border-black focus:outline-none"
            placeholder="Your brand or organization name"
          />
        </div>
        <div>
          <label className="text-[11px] uppercase font-medium text-[#1A1A1A] mb-1 block">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            rows={3}
            className="w-full px-4 py-3 text-[14px] border border-black focus:outline-none resize-none"
            placeholder="Tell people about your brand"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] uppercase font-medium text-[#1A1A1A] mb-1 block">Website</label>
            <input
              type="url"
              value={profile.website}
              onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
              className="w-full px-4 py-3 text-[14px] border border-black focus:outline-none"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-[11px] uppercase font-medium text-[#1A1A1A] mb-1 block">Instagram</label>
            <input
              type="text"
              value={profile.instagram}
              onChange={(e) => setProfile((p) => ({ ...p, instagram: e.target.value }))}
              className="w-full px-4 py-3 text-[14px] border border-black focus:outline-none"
              placeholder="@handle"
            />
          </div>
          <div>
            <label className="text-[11px] uppercase font-medium text-[#1A1A1A] mb-1 block">Twitter</label>
            <input
              type="text"
              value={profile.twitter}
              onChange={(e) => setProfile((p) => ({ ...p, twitter: e.target.value }))}
              className="w-full px-4 py-3 text-[14px] border border-black focus:outline-none"
              placeholder="@handle"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-3 text-[13px] uppercase font-medium bg-[#1A1A1A] text-white border border-[#1A1A1A] hover:bg-[#FA76FF] hover:text-black hover:border-[#FA76FF] transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>

      {profileId && (
        <p className="text-[12px] text-gray-500">
          Profile URL: <a href={`/organizer/${profileId}`} className="underline">/organizer/{profileId}</a>
        </p>
      )}
    </div>
  );
};
