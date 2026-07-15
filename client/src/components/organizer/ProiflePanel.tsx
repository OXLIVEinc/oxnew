// client/src/components/organizer/ProfilePanel.tsx
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrganizerProfile, useUpdateOrganizerProfile } from "@/hooks/api/useOrganizer";

export const ProfilePanel: React.FC = () => {
  const { data: profile, isLoading } = useOrganizerProfile();
  const update = useUpdateOrganizerProfile();
  const [form, setForm] = useState({ brandName: "", bio: "", website: "", instagram: "", twitter: "" });

  useEffect(() => {
    if (profile) setForm({
      brandName: profile.brandName ?? "", bio: profile.bio ?? "", website: profile.website ?? "",
      instagram: profile.instagram ?? "", twitter: profile.twitter ?? "",
    });
  }, [profile]);

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading profile...</div>;

  return (
    <Card className="max-w-2xl">
      <CardHeader><CardTitle className="text-base">Brand Profile</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5"><Label>Brand Name</Label>
          <Input value={form.brandName} onChange={(e) => setForm((f) => ({ ...f, brandName: e.target.value }))} /></div>
        <div className="space-y-1.5"><Label>Bio</Label>
          <Textarea rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} /></div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5"><Label>Website</Label>
            <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://..." /></div>
          <div className="space-y-1.5"><Label>Instagram</Label>
            <Input value={form.instagram} onChange={(e) => setForm((f) => ({ ...f, instagram: e.target.value }))} placeholder="@handle" /></div>
          <div className="space-y-1.5"><Label>Twitter</Label>
            <Input value={form.twitter} onChange={(e) => setForm((f) => ({ ...f, twitter: e.target.value }))} placeholder="@handle" /></div>
        </div>
        <Button onClick={() => update.mutate(form)} disabled={update.isPending}>
          {update.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  );
};