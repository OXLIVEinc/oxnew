import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

const NotificationsSkeleton = () => (
  <div className="space-y-3 w-full animate-pulse">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="border border-border p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 bg-muted rounded" />
            <div className="h-4 w-full bg-muted rounded" />
            <div className="h-4 w-5/6 bg-muted rounded" />
          </div>

          <div className="w-2 h-2 rounded-full bg-muted flex-shrink-0 mt-1" />
        </div>

        <div className="h-3 w-28 bg-muted rounded mt-3" />
      </div>
    ))}
  </div>
);

export const NotificationsTab: React.FC<{ userId: string }> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setNotifications(data || []);
      setLoading(false);
    };
    fetchNotifications();
  }, [userId]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  if (loading) {
  return <NotificationsSkeleton />;
}

  if (notifications.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">No notifications yet</div>;
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          onClick={() => !notif.read && markAsRead(notif.id)}
          className={`border p-4 cursor-pointer transition-colors ${
            notif.read ? 'border-muted bg-background' : 'border-border bg-muted'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className={`text-sm ${notif.read ? 'font-normal' : 'font-medium'}`}>{notif.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
            </div>
            {!notif.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />}
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};
