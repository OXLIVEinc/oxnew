/**
 * src/components/hotel/HotelProfilePanel.tsx
 * -------------------------------------------------------------------------
 */
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Plus, X } from "lucide-react";
import { useHotelProfile, useUpdateHotelProfile } from "@/hooks/api/useHotelProfile";

export const HotelProfilePanel: React.FC = () => {
  const { data: hotel, isLoading } = useHotelProfile();
  const update = useUpdateHotelProfile();

  const [form, setForm] = useState({
    name: "",
    description: "",
    logoUrl: "",
    coverImageUrl: "",
    address: "",
    state: "",
    city: "",
    whatsappNumber: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [amenities, setAmenities] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState("");

  useEffect(() => {
    if (hotel) {
      setForm({
        name: hotel.name ?? "",
        description: hotel.description ?? "",
        logoUrl: hotel.logoUrl ?? "",
        coverImageUrl: hotel.coverImageUrl ?? "",
        address: hotel.address ?? "",
        state: hotel.state ?? "",
        city: hotel.city ?? "",
        whatsappNumber: hotel.whatsappNumber ?? "",
        bankName: hotel.bankAccountDetails?.bankName ?? "",
        accountNumber: hotel.bankAccountDetails?.accountNumber ?? "",
        accountName: hotel.bankAccountDetails?.accountName ?? "",
      });
      setAmenities(hotel.amenities ?? []);
    }
  }, [hotel]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const addAmenity = () => {
    const value = newAmenity.trim();
    if (value && !amenities.includes(value)) setAmenities((a) => [...a, value]);
    setNewAmenity("");
  };

  const handleSave = () => {
    update.mutate({
      name: form.name,
      description: form.description || null,
      logoUrl: form.logoUrl || null,
      coverImageUrl: form.coverImageUrl || null,
      address: form.address,
      state: form.state,
      city: form.city,
      whatsappNumber: form.whatsappNumber,
      amenities,
      bankAccountDetails:
        form.bankName && form.accountNumber && form.accountName
          ? { bankName: form.bankName, accountNumber: form.accountNumber, accountName: form.accountName }
          : null,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hotel Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Hotel Name</Label>
              <Input value={form.name} onChange={set("name")} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={4} value={form.description} onChange={set("description")} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Logo URL</Label>
                <Input value={form.logoUrl} onChange={set("logoUrl")} placeholder="https://..." />
              </div>
              <div className="space-y-1.5">
                <Label>Cover Image URL</Label>
                <Input value={form.coverImageUrl} onChange={set("coverImageUrl")} placeholder="https://..." />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location & Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input value={form.address} onChange={set("address")} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input value={form.state} onChange={set("state")} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={form.city} onChange={set("city")} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp Number</Label>
              <Input value={form.whatsappNumber} onChange={set("whatsappNumber")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Amenities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => (
                <Badge key={a} variant="secondary" className="gap-1">
                  {a}
                  <button onClick={() => setAmenities((list) => list.filter((x) => x !== a))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="e.g. Free WiFi"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
              />
              <Button type="button" variant="outline" onClick={addAmenity}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bank Account Details</CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Bank Name</Label>
              <Input value={form.bankName} onChange={set("bankName")} />
            </div>
            <div className="space-y-1.5">
              <Label>Account Number</Label>
              <Input value={form.accountNumber} onChange={set("accountNumber")} />
            </div>
            <div className="space-y-1.5">
              <Label>Account Name</Label>
              <Input value={form.accountName} onChange={set("accountName")} />
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={update.isPending}>
          Save Changes
        </Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">Guest Preview</p>
        <Card className="overflow-hidden">
          <div
            className="h-32 bg-muted bg-cover bg-center"
            style={form.coverImageUrl ? { backgroundImage: `url(${form.coverImageUrl})` } : undefined}
          />
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="" className="h-10 w-10 rounded-lg object-cover border" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-muted" />
              )}
              <div>
                <p className="font-semibold text-sm">{form.name || "Your Hotel Name"}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {form.city || "City"}, {form.state || "State"}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {form.description || "Your hotel description will appear here."}
            </p>
            {amenities.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {amenities.slice(0, 4).map((a) => (
                  <Badge key={a} variant="outline" className="text-[10px]">
                    {a}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
