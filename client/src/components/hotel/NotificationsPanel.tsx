/**
 * src/components/hotel/NotificationsPanel.tsx
 * -------------------------------------------------------------------------
 */
import React,{useState} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell } from "lucide-react";
import { useHotelNotifications, useMarkAllNotificationsRead, useMarkNotificationRead } from "@/hooks/api/useHotelNotifications";
import { formatDateTime } from "@/lib/hotelFormat";
import { BookingDetailDialog } from "./BookingDetailDialog";

export const NotificationsPanel: React.FC = () => {
  const { data, isLoading } = useHotelNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

//   const handleNotificationClick = (n: typeof data.notifications[number]) => {
//   if (!n.read) {
//     markRead.mutate(n.id);
//   }

//   if (n.bookingId) {
//     setSelectedBookingId(n.bookingId);
//   }
// };

  return (
    <>
      <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Notifications
          {Boolean(data?.unreadCount) && <Badge variant="destructive">{data!.unreadCount} unread</Badge>}
        </CardTitle>
        {Boolean(data?.unreadCount) && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            Mark all read
          </Button>
        )}
      </CardHeader>
      <CardContent className="divide-y">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full my-1" />)
        ) : data && data.notifications.length > 0 ? (
          data.notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read && markRead.mutate(n.id)}
              className={`w-full text-left py-3 flex items-start gap-3 ${!n.read ? "bg-muted/40" : ""}`}
            >
              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${!n.read ? "bg-primary" : "bg-transparent"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{formatDateTime(n.createdAt)}</p>
              </div>
            </button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground py-10 text-center">No notifications yet</p>
        )}
      </CardContent>
    </Card>

    <BookingDetailDialog
    bookingId={selectedBookingId}
    onClose={() => setSelectedBookingId(null)}
  />
    </>
  );
};
