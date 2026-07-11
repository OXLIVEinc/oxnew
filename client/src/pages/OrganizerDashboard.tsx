import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { SEOHead } from '@/components/SEOHead';
import { DashboardSidebar, DashboardTab } from '@/components/organizer/DashboardSidebar';
import { DashboardOverviewCards } from '@/components/organizer/DashboardOverviewCards';
import { EventOverview } from '@/components/organizer/EventOverview';
import { GuestListPanel } from '@/components/organizer/GuestListPanel';
import { AnalyticsPanel } from '@/components/organizer/AnalyticsPanel';
import { CampaignsPanel } from '@/components/organizer/CampaignsPanel';
import { QRScannerPanel } from '@/components/organizer/QRScannerPanel';
import { OrganizerProfileEditor } from '@/components/OrganizerProfileEditor';
import { OrganizerTicketsTab } from '@/components/organizer/OrganizerTicketsTab';
import { SubscriptionPanel } from '@/components/organizer/SubscriptionPanel';
import { FeatureGate } from '@/components/organizer/FeatureGate';
import { Menu } from 'lucide-react';

const OrganizerDashboard = () => {
  const { user, authUser, role, isOrganizer, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle tab from URL query param
  useEffect(() => {
    const tab = searchParams.get('tab') as DashboardTab | null;
    if (tab && ['overview', 'events', 'guests', 'scanner', 'analytics', 'campaigns', 'brand', 'tickets', 'subscription'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user) navigate('/');
    if (!loading && user && !isOrganizer) navigate('/dashboard');
  }, [loading, user, isOrganizer, navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background text-foreground">Loading...</div>;
  if (!isOrganizer) return null;

  const displayName = user?.display_name || authUser?.email?.split('@')[0] || 'User';

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <DashboardOverviewCards />
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Event Overview</h2>
                <button
                  onClick={() => setActiveTab('events')}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                >
                  View All <span>›</span>
                </button>
              </div>
              <EventOverview onSelectEvent={setSelectedEventId} selectedEventId={selectedEventId} />
            </div>
          </div>
        );
      case 'events':
        return <EventOverview onSelectEvent={setSelectedEventId} selectedEventId={selectedEventId} />;
      case 'guests':
        return <GuestListPanel eventId={selectedEventId} />;
      case 'analytics':
        return (
          <FeatureGate feature="analytics" onUpgrade={() => setActiveTab('subscription')}>
            <AnalyticsPanel eventId={selectedEventId} />
          </FeatureGate>
        );
      case 'campaigns':
        return (
          <FeatureGate feature="campaigns" onUpgrade={() => setActiveTab('subscription')}>
            <CampaignsPanel eventId={selectedEventId} />
          </FeatureGate>
        );
      case 'scanner':
        return <QRScannerPanel eventId={selectedEventId} />;
      case 'brand':
        return user ? <OrganizerProfileEditor userId={user.id} /> : null;
      case 'tickets':
        return <OrganizerTicketsTab />;
      case 'subscription':
        return <SubscriptionPanel />;
      default:
        return null;
    }
  };

  const tabTitles: Record<DashboardTab, string> = {
    overview: 'Dashboard',
    events: 'My Events',
    guests: 'Guest List',
    scanner: 'QR Check-in',
    analytics: 'Analytics',
    campaigns: 'Campaigns',
    brand: 'Brand Profile',
    tickets: 'My Tickets',
    subscription: 'Plans & Pricing',
  };

  return (
    <div className="flex min-h-screen bg-background">
      <SEOHead title="Organizer Dashboard" description="Manage your events, guests, and campaigns" />

      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userName={displayName}
        userRole={role || 'organizer'}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-md hover:bg-accent text-foreground"
          >
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold text-foreground">{tabTitles[activeTab]}</h1>
            {activeTab === 'overview' && (
              <p className="text-sm text-muted-foreground hidden sm:block">Welcome back, {displayName}</p>
            )}
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default OrganizerDashboard;
