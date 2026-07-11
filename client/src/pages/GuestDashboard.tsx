import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '@/hooks/useUserRole';
import { SEOHead } from '@/components/SEOHead';
import { RegisteredEventsTab } from '@/components/guest/RegisteredEventsTab';
import { TicketsTab } from '@/components/guest/TicketsTab';
import { NotificationsTab } from '@/components/guest/NotificationsTab';
import { ProfileTab } from '@/components/guest/ProfileTab';
import { Calendar, Ticket, Bell, User } from 'lucide-react';

type Tab = 'events' | 'tickets' | 'notifications' | 'profile';

const GuestDashboard = () => {
  const {
    user,
    role,
    loading: roleLoading,
    isGuest,
  } = useUserRole();

  const [activeTab, setActiveTab] = useState<Tab>('events');
  const navigate = useNavigate();

  useEffect(() => {
    if (roleLoading) return;

    // Not logged in
    if (!user) {
      navigate('/');
      return;
    }

    // Logged in but not a guest
    if (!isGuest) {
      navigate('/');
      return;
    }
  }, [roleLoading, user, isGuest, navigate]);

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // Prevent rendering while redirecting
  if (!user || !isGuest) {
    return null;
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: 'events',
      label: 'My Events',
      icon: <Calendar size={14} />,
    },
    {
      key: 'tickets',
      label: 'Tickets',
      icon: <Ticket size={14} />,
    },
    {
      key: 'notifications',
      label: 'Notifications',
      icon: <Bell size={14} />,
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: <User size={14} />,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="My Dashboard"
        description="View your events, tickets, and notifications"
      />

      <Navbar />

      <div className="pt-28 pb-16 px-4 md:px-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-medium mb-8">
          My Dashboard
        </h1>

        <div className="flex flex-wrap gap-0 mb-8 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 md:px-6 py-3 text-[11px] font-medium uppercase transition-colors border border-b-0 border-border -mb-px ${
                activeTab === tab.key
                  ? 'bg-foreground text-background'
                  : 'bg-background text-foreground hover:bg-muted'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'events' && <RegisteredEventsTab />}
        {activeTab === 'tickets' && <TicketsTab />}
        {activeTab === 'notifications' && (
          <NotificationsTab userId={user.id} />
        )}
        {activeTab === 'profile' && <ProfileTab userId={user.id} />}
      </div>
    </div>
  );
};

export default GuestDashboard;