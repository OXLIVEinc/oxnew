import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const ProfileTab: React.FC<{ userId: string }> = ({ userId }) => {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [locationCountry, setLocationCountry] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email || '');

      const { data } = await supabase
        .from('profiles')
        .select('display_name, phone, gender, location_country')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setDisplayName(data.display_name || '');
        setPhone(data.phone || '');
        setGender(data.gender || '');
        setLocationCountry(data.location_country || '');
      }
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName.trim() || null,
        phone: phone.trim() || null,
        gender: gender.trim() || null,
        location_country: locationCountry.trim() || null,
      })
      .eq('user_id', userId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated!', description: 'Your profile has been saved.' });
    }
    setSaving(false);
  };

  if (loading) return <div className="py-12 text-center">Loading profile...</div>;

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <label className="block text-[11px] uppercase font-medium mb-2">Email</label>
        <input
          type="email"
          value={email}
          disabled
          className="w-full border border-muted px-4 py-3 text-sm bg-muted text-muted-foreground"
        />
      </div>
      <div>
        <label className="block text-[11px] uppercase font-medium mb-2">Full Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full border border-border px-4 py-3 text-sm focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-[11px] uppercase font-medium mb-2">Phone</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border border-border px-4 py-3 text-sm focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-[11px] uppercase font-medium mb-2">Gender</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          className="w-full border border-border px-4 py-3 text-sm focus:outline-none bg-background"
        >
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non-binary">Non-binary</option>
          <option value="prefer-not-to-say">Prefer not to say</option>
        </select>
      </div>
      <div>
        <label className="block text-[11px] uppercase font-medium mb-2">Country</label>
        <input
          type="text"
          value={locationCountry}
          onChange={(e) => setLocationCountry(e.target.value)}
          className="w-full border border-border px-4 py-3 text-sm focus:outline-none"
          placeholder="e.g. Nigeria, United States"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-foreground text-background px-6 py-3 text-[11px] uppercase font-medium hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );
};
