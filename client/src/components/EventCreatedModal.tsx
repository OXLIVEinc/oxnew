import {
  Dialog,
  DialogContent,
  DialogOverlay,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BadgeCheck } from "lucide-react";

interface EventCreatedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: string;
  approvalStatus: string;
  onViewEvents: () => void;
}

export function EventCreatedModal({
  open,
  onOpenChange,
  status,
  approvalStatus,
  onViewEvents,
}: EventCreatedModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm" />

      <DialogContent
        className="
          z-[99999]
          w-[calc(100vw-2rem)]
          max-w-md
          max-h-[90vh]
          overflow-y-auto
          rounded-3xl
          border-0
          p-5
          sm:p-6
          shadow-2xl
        "
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-green-200 bg-green-50">
            <BadgeCheck className="h-8 w-8 text-green-600" />
          </div>

          <h2 className="text-xl sm:text-2xl font-medium">
            Event Submitted
          </h2>

          <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
            Your event has been submitted successfully and is awaiting review.
          </p>

          <div className="mt-6 w-full rounded-2xl border bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Status
              </span>

              <span className="rounded-full border px-3 py-1 text-xs font-medium capitalize whitespace-nowrap">
                {status}
              </span>
            </div>

            <div className="mt-4 border-t pt-4 flex items-center justify-between gap-4">
              <span className="text-sm text-muted-foreground">
                Approval
              </span>

              <span className="rounded-full border px-3 py-1 text-xs font-medium capitalize whitespace-nowrap">
                {approvalStatus}
              </span>
            </div>
          </div>

          <div className="mt-5 w-full rounded-2xl border bg-primary/5 p-4">
            <p className="text-sm leading-6 text-muted-foreground">
              Reviews are typically completed within{" "}
              <span className="font-medium text-foreground">
                24 hours
              </span>
              . You'll be notified once your event is approved.
            </p>
          </div>

          <Button
            className="mt-6 h-11 w-full rounded-xl"
            onClick={onViewEvents}
          >
            Go to My Events
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}