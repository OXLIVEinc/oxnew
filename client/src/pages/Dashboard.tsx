import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/Navbar';
import Admin from './Admin';
import OrganizerDashboard from './OrganizerDashboard';
import GuestDashboard from './GuestDashboard';
import HotelPartnerDashboard from './HotelPartnerDashboard';

/**
 * Single entry point for "/dashboard". AuthProvider has already resolved
 * the session and role by the time this renders, so this just picks the
 * right dashboard component for the current user's role.
 */
const Dashboard = () => {
  const { authUser, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!authUser) {
    return <Navigate to="/" replace />;
  }

  switch (role) {
    case 'admin':
      return <Admin />;
    case 'organizer':
      return <OrganizerDashboard />;
    case 'hotel_partner':
      return <HotelPartnerDashboard />;
    case 'guest':
      return <GuestDashboard />;
    default:
      // Signed in, but no role has been assigned yet.
      return (
        <div className="min-h-screen bg-background">
          <Navbar />
          <div className="pt-28 px-4 md:px-8 text-center">
            <p className="text-foreground opacity-70">
              Your account doesn't have a role assigned yet. Please contact support.
            </p>
          </div>
        </div>
      );
  }
};

export default Dashboard;
