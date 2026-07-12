import React, { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

const PREFS_KEY = "ox_hotel_notification_prefs";

interface NotificationPrefs {
  newBooking: boolean;
  cancellations: boolean;
  payoutUpdates: boolean;
}

function loadPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore malformed local state
  }
  return { newBooking: true, cancellations: true, payoutUpdates: true };
}

export const SettingsPanel: React.FC<{ onGoToProfile: () => void }> = ({ onGoToProfile }) => {
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setNewPasswordConfirm] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const updatePref = (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated");
      setNewPassword("");
      setNewPasswordConfirm("");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
          <CardDescription>Update the password used to sign in to this dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setNewPasswordConfirm(e.target.value)} />
            </div>
          </div>
          <Button onClick={handlePasswordChange} disabled={changingPassword || !newPassword}>
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notification Preferences</CardTitle>
          <CardDescription>Choose which events trigger a toast and notification entry.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">New bookings & confirmations needed</p>
              <p className="text-xs text-muted-foreground">Get notified when a guest pays for a booking</p>
            </div>
            <Switch checked={prefs.newBooking} onCheckedChange={(v) => updatePref("newBooking", v)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Cancellations</p>
              <p className="text-xs text-muted-foreground">Get notified when a guest cancels a booking</p>
            </div>
            <Switch checked={prefs.cancellations} onCheckedChange={(v) => updatePref("cancellations", v)} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Payout updates</p>
              <p className="text-xs text-muted-foreground">Get notified about payout status changes</p>
            </div>
            <Switch checked={prefs.payoutUpdates} onCheckedChange={(v) => updatePref("payoutUpdates", v)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hotel Information</CardTitle>
          <CardDescription>Manage your hotel's name, address, amenities, and bank details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={onGoToProfile}>
            Go to Hotel Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
