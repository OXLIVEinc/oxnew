import {
  Dialog,
  DialogContent,
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
      <DialogContent className="sm:max-w-lg">
        <div className="flex flex-col items-center text-center py-4">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-5">
            <BadgeCheck className="h-9 w-9 text-green-600" />
          </div>

          <h2 className="text-2xl font-semibold">
            Event Submitted Successfully
          </h2>

          <p className="mt-3 text-muted-foreground">
            Your event has been created and submitted for review.
          </p>

          <div className="mt-6 w-full rounded-lg border p-4 space-y-4 text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Event Status
              </span>

              <span className="font-medium capitalize">
                {status}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Approval Status
              </span>

              <span className="font-medium capitalize">
                {approvalStatus}
              </span>
            </div>
          </div>

          <div className="mt-5 rounded-md bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
            Your event is currently under review by our team.
            <br />
            Approval usually takes less than <strong>24 hours</strong>.
            You'll be notified once it's approved and becomes publicly visible.
          </div>

          <Button
            className="w-full mt-6"
            onClick={onViewEvents}
          >
            Go to My Events
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}