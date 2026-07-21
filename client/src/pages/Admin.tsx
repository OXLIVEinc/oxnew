import { useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { useAdminAuth } from '@/components/admin/useAdminAuth';
import { AdminLayout, type AdminTab } from '@/components/admin/AdminLayout';
import { AdminOverview } from '@/components/admin/AdminOverview';
import { AdminEventsPanel } from '@/components/admin/AdminEventsPanel';
import { AdminOrganizersPanel } from '@/components/admin/AdminOrganizersPanel';
import { AdminTicketsPanel } from '@/components/admin/AdminTicketsPanel';
import { AdminPaymentsPanel } from '@/components/admin/AdminPaymentsPanel';
import { AdminSubscriptionsPanel } from '@/components/admin/AdminSubscriptionsPanel';
import { AdminAnalyticsPanel } from '@/components/admin/AdminAnalyticsPanel';
import { AdminBroadcastPanel } from '@/components/admin/AdminBroadcastPanel';

const Admin = () => {
  const { user, isAdmin, loading, signOut } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(222,84%,4.9%)] text-[hsl(215,20%,65%)]">
        Loading...
      </div>
    );
  }

  if (!isAdmin) return null;

  const panels: Record<AdminTab, JSX.Element> = {
    overview: <AdminOverview />,
    events: <AdminEventsPanel />,
    organizers: <AdminOrganizersPanel />,
    tickets: <AdminTicketsPanel />,
    payments: <AdminPaymentsPanel />,
    subscriptions: <AdminSubscriptionsPanel />,
    analytics: <AdminAnalyticsPanel />,
    broadcast: <AdminBroadcastPanel />,
  };

  return (
    <div className="dark">
      <SEOHead title="Internal Dashboard" description="OX Entertainment internal management" />
      <AdminLayout activeTab={activeTab} onTabChange={setActiveTab} onSignOut={signOut} adminName={user?.email || 'Admin'}>
        {panels[activeTab]}
      </AdminLayout>
    </div>
  );
};

export default Admin;
