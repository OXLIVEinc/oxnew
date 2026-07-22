import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const ProfileSkeleton = () => (
  <div className="max-w-lg space-y-5 animate-pulse">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i}>
        <div className="h-3 w-24 bg-muted rounded mb-2" />
        <div className="h-12 w-full bg-muted rounded" />
      </div>
    ))}

    <div className="h-12 w-full bg-muted rounded mt-2" />
  </div>
);

export const ProfileTab: React.FC = () => {
  const { profile, authUser, loading, refresh } = useAuth();
  const { toast } = useToast();
  console.log(profile);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;

    setDisplayName(profile.display_name || "");
    setPhone(profile.phone || "");
    setGender(profile.gender || "");
    setLocationCountry(profile.location_country || "");
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        gender: gender.trim() || null,
        location_country: locationCountry.trim() || null,
      })
      .eq("id", profile.id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      await refresh();

      toast({
        title: "Profile updated!",
        description: "Your profile has been saved.",
      });
    }

    setSaving(false);
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <div className="text-sm text-muted-foreground">
        Unable to load your profile.
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <label className="block text-[11px] uppercase font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          value={authUser?.email ?? ""}
          disabled
          className="w-full border border-muted px-4 py-3 text-sm bg-muted text-muted-foreground"
        />
      </div>

      <div>
        <label className="block text-[11px] uppercase font-medium mb-2">
          Phone
        </label>
        <input
          type="tel"
          value={phone}
          disabled
          className="w-full border border-muted px-4 py-3 text-sm bg-muted text-muted-foreground cursor-not-allowed"
        />
        {/* <p className="mt-2 text-xs text-muted-foreground">
          Phone numbers cannot be changed. Contact support if you need to update
          it.
        </p> */}
      </div>

      <div>
        <label className="block text-[11px] uppercase font-medium mb-2">
          Full Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full border border-border px-4 py-3 text-sm focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-[11px] uppercase font-medium mb-2">
          Gender
        </label>
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
        <label className="block text-[11px] uppercase font-medium mb-2">
          Country
        </label>
        <input
          type="text"
          value={locationCountry}
          onChange={(e) => setLocationCountry(e.target.value)}
          placeholder="e.g. Nigeria, United States"
          className="w-full border border-border px-4 py-3 text-sm focus:outline-none"
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-foreground text-background px-6 py-3 text-[11px] uppercase font-medium hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </div>
  );
};
