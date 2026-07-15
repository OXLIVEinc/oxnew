// client/src/components/organizer/CampaignsPanel.tsx
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { useCampaigns, useCreateCampaign } from "@/hooks/api/useOrganizer";

interface Props { eventId: string | null; }

export const CampaignsPanel: React.FC<Props> = ({ eventId }) => {
  const { data: campaigns, isLoading } = useCampaigns(eventId);
  const createCampaign = useCreateCampaign(eventId);
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"email" | "sms">("email");

  if (!eventId) return <div className="py-12 text-center text-muted-foreground">Select an event from the Events tab first</div>;

  const handleSend = () => {
    if (!subject.trim() || !message.trim()) return;
    createCampaign.mutate({ subject: subject.trim(), message: message.trim(), type }, {
      onSuccess: () => { setSubject(""); setMessage(""); setShowCreate(false); },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Campaigns</h2>
        <Button variant={showCreate ? "outline" : "default"} onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Cancel" : "New Campaign"}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-0 w-fit">
              <button onClick={() => setType("email")} className={`px-4 py-2 text-xs uppercase font-medium border rounded-l ${type === "email" ? "bg-foreground text-background border-foreground" : "bg-background border-border"}`}>Email</button>
              <button onClick={() => setType("sms")} className={`px-4 py-2 text-xs uppercase font-medium border border-l-0 rounded-r ${type === "sms" ? "bg-foreground text-background border-foreground" : "bg-background border-border"}`}>SMS</button>
            </div>
            <input type="text" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full border border-border rounded px-4 py-3 text-sm bg-background" />
            <textarea placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="w-full border border-border rounded px-4 py-3 text-sm bg-background resize-none" />
            <Button onClick={handleSend} disabled={createCampaign.isPending}>
              <Send size={14} className="mr-2" /> {createCampaign.isPending ? "Sending..." : "Send to All Registrants"}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading campaigns...</div>
      ) : !campaigns || campaigns.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No campaigns yet</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {campaigns.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-sm">{c.subject}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {c.type.toUpperCase()} · {c.recipientCount} recipients · {c.sentAt ? new Date(c.sentAt).toLocaleDateString() : "Draft"}
                  </p>
                </div>
                <span className="text-xs uppercase px-2 py-1 rounded bg-green-500/10 text-green-700">{c.status}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};