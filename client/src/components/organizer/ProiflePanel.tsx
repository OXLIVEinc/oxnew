import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useOrganizerProfile,
  useUpdateOrganizerProfile,
} from "@/hooks/api/useOrganizer";

const ProfilePanelSkeleton = () => (
  <Card className="max-w-2xl animate-pulse">
    <CardHeader>
      <Skeleton className="h-6 w-36" />
    </CardHeader>

    <CardContent className="space-y-6">
      {/* Brand Name */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-24 w-full" />
      </div>

      {/* Socials */}
      <div className="grid sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>

      {/* Button */}
      <Skeleton className="h-10 w-36" />
    </CardContent>
  </Card>
);

export const ProfilePanel: React.FC = () => {
  const { data: profile, isLoading } = useOrganizerProfile();
  const update = useUpdateOrganizerProfile();

  const [form, setForm] = useState({
    brandName: "",
    bio: "",
    website: "",
    instagram: "",
    twitter: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        brandName: profile.brandName ?? "",
        bio: profile.bio ?? "",
        website: profile.website ?? "",
        instagram: profile.instagram ?? "",
        twitter: profile.twitter ?? "",
      });
    }
  }, [profile]);

  if (isLoading) {
    return <ProfilePanelSkeleton />;
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Brand Profile</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Brand Name</Label>
          <Input
            value={form.brandName}
            onChange={(e) =>
              setForm((f) => ({ ...f, brandName: e.target.value }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>Bio</Label>
          <Textarea
            rows={3}
            value={form.bio}
            onChange={(e) =>
              setForm((f) => ({ ...f, bio: e.target.value }))
            }
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Website</Label>
            <Input
              value={form.website}
              placeholder="https://..."
              onChange={(e) =>
                setForm((f) => ({ ...f, website: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>Instagram</Label>
            <Input
              value={form.instagram}
              placeholder="@handle"
              onChange={(e) =>
                setForm((f) => ({ ...f, instagram: e.target.value }))
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label>Twitter</Label>
            <Input
              value={form.twitter}
              placeholder="@handle"
              onChange={(e) =>
                setForm((f) => ({ ...f, twitter: e.target.value }))
              }
            />
          </div>
        </div>

        <Button
          onClick={() => update.mutate(form)}
          disabled={update.isPending}
        >
          {update.isPending ? "Saving..." : "Save Profile"}
        </Button>
      </CardContent>
    </Card>
  );
};