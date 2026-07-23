import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useOrganizerEvents, useUpdateEventStatus } from "@/hooks/api/useOrganizer";



const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default", 
  draft: "outline", 
  soldout: "destructive", 
  postponed: "secondary", 
  closed: "outline",
};

export const EventsPanel = () => {
  const { data: events, isLoading } = useOrganizerEvents();
  const updateStatus = useUpdateEventStatus();
  const navigate = useNavigate();

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingEventId, setPendingEventId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string>("");

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full" />
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No events yet.{" "}
          <button className="underline" onClick={() => navigate("/create-event")}>
            Create one
          </button>
        </CardContent>
      </Card>
    );
  }

  const handleStatusChange = (eventId: string, newStatus: string) => {
    const currentEvent = events.find((e) => e.id === eventId);
    if (currentEvent?.status === newStatus) return;

    setPendingEventId(eventId);
    setPendingStatus(newStatus);
    setShowConfirmModal(true);
  };

  const confirmStatusChange = () => {
    if (pendingEventId && pendingStatus) {
      updateStatus.mutate(
        { id: pendingEventId, status: pendingStatus },
        {
          onSuccess: () => {
            closeModal(); // Only close modal after successful API response
          },
          onError: () => {
            // Modal stays open on error so user can retry
            console.error("Failed to update status");
          },
        }
      );
    }
  };

  const closeModal = () => {
    setShowConfirmModal(false);
    setPendingEventId(null);
    setPendingStatus("");
  };

  const isUpdating = updateStatus.isPending;

  return (
    <>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {events.map((event) => (
          <Card
  key={event.id}
  className="overflow-hidden transition-shadow hover:shadow-md"
>
            <div className="aspect-video bg-muted overflow-hidden">
              <img
                src={event.backgroundImageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm truncate">{event.title}</h3>
                <Badge
                  variant={STATUS_VARIANT[event.status] ?? "outline"}
                  className="shrink-0 capitalize"
                >
                  {event.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{event.date}</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{event.guestCount} guests</span>
                <select
                  value={event.status}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleStatusChange(event.id, e.target.value);
                  }}
                  className="border border-border rounded px-2 py-1 bg-background text-xs"
                  disabled={isUpdating}
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

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg max-w-md w-full shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-2xl">
                  ⚠️
                </div>
                <h2 className="text-xl font-semibold">Critical Action — Confirm Status Change</h2>
              </div>

              <p className="text-muted-foreground mb-4">
                You are about to change the event status to{" "}
                <span className="font-medium text-foreground uppercase">"{pendingStatus}"</span>.
              </p>
              
              <p className="text-destructive font-medium mb-6">
                This is a critical operation. It will immediately affect event visibility, 
                registrations, and guest experience. This action cannot be easily undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  disabled={isUpdating}
                  className="flex-1 py-3 border border-border hover:bg-muted transition-colors font-medium rounded-md disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusChange}
                  disabled={isUpdating}
                  className="flex-1 py-3 bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium rounded-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      Updating...
                    </>
                  ) : (
                    "Yes, Change Status"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};