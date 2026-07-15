// client/src/components/organizer/EventsPanel.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useOrganizerEvents, useUpdateEventStatus } from "@/hooks/api/useOrganizer";

interface Props { onSelectEvent: (id: string | null) => void; selectedEventId: string | null; }

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default", draft: "outline", soldout: "destructive", postponed: "secondary", closed: "outline",
};

export const EventsPanel: React.FC<Props> = ({ onSelectEvent, selectedEventId }) => {
  const { data: events, isLoading } = useOrganizerEvents();
  const updateStatus = useUpdateEventStatus();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No events yet.{" "}
          <button className="underline" onClick={() => navigate("/create-event")}>Create one</button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {events.map((event) => (
        <Card
          key={event.id}
          className={`cursor-pointer transition-colors overflow-hidden ${selectedEventId === event.id ? "ring-2 ring-primary" : ""}`}
          onClick={() => onSelectEvent(event.id)}
        >
          <div className="aspect-video bg-muted overflow-hidden">
            <img src={event.backgroundImageUrl} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
          </div>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm truncate">{event.title}</h3>
              <Badge variant={STATUS_VARIANT[event.status] ?? "outline"} className="shrink-0 capitalize">{event.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{event.date}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{event.guestCount} guests</span>
              <select
                value={event.status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updateStatus.mutate({ id: event.id, status: e.target.value })}
                className="border border-border rounded px-2 py-1 bg-background text-xs"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="soldout">Sold Out</option>
                <option value="postponed">Postponed</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};