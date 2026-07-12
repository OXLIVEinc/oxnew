import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthSheet } from './AuthSheet';
import { useAuth } from '@/context/AuthContext';
import oxLogo from '@/assets/ox-logo.jpg';

export const Navbar: React.FC = () => {
  const { user, role, isOrganizer, isHotelPartner } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  useEffect(() => {
    if (user && pendingRoute) {
      navigate(pendingRoute);
      setPendingRoute(null);
      setIsAuthOpen(false);
    }
  }, [user, pendingRoute, navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.profile-dropdown')) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Every role lands on /dashboard now — it renders the right view for you.
  const dashboardPath = '/dashboard';

  const getDashboardLabel = () => {
    if (role === 'admin') return 'ADMIN';
    if (isOrganizer) return 'DASHBOARD';
    if (isHotelPartner) return 'PARTNER DASHBOARD';
    return 'MY DASHBOARD';
  };

  const dashboardLabel = getDashboardLabel();

  // Get user's display name or email
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Get user's avatar or initials
  const getUserAvatar = () => {
    if (user?.user_metadata?.avatar_url) {
      return user.user_metadata.avatar_url;
    }
    return null;
  };

  const userDisplayName = getUserDisplayName();
  const userAvatar = getUserAvatar();

  return createPortal(
    <>
      <nav className="fixed top-3 left-4 md:left-8 right-4 md:right-8 z-[2000] flex items-center justify-between">
        {/* Logo and Brand - Left Side */}
        <div className="flex items-center gap-2">
          <Link to="/" className="block w-10 h-10 md:w-12 md:h-12 overflow-hidden border border-foreground bg-background hover:scale-110 hover:shadow-lg transition-all duration-300 group">
            <img src={oxLogo} alt="OX" className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300" />
          </Link>
          <span className='font-bold text-foreground'>Ticketox</span>
        </div>

        {/* Desktop Navigation - Right Side */}
        <div className="hidden md:flex items-center">
          <Link 
            to="/" 
            className="relative overflow-hidden bg-background text-foreground h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border border-foreground leading-none group"
          >
            <span className="relative z-10">DISCOVER</span>
            <span className="absolute inset-0 bg-[hsl(300,100%,73%)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
          </Link>

          {/* Only show Create Event for organizers */}
          {isOrganizer && (
            <button 
              onClick={() => {
                if (user) navigate('/create-event');
                else { setPendingRoute('/create-event'); setIsAuthOpen(true); }
              }}
              className="relative overflow-hidden bg-background text-foreground h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border-l-0 border border-foreground leading-none group"
            >
              <span className="relative z-10">CREATE EVENT</span>
              <span className="absolute inset-0 bg-[hsl(300,100%,73%)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
            </button>
          )}

          {user ? (
            <>
              <Link 
                to={dashboardPath}
                className="relative overflow-hidden bg-background text-foreground h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border-l-0 border border-foreground leading-none group"
              >
                <span className="relative z-10">{dashboardLabel}</span>
                <span className="absolute inset-0 bg-[hsl(300,100%,73%)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
              </Link>

              {/* Only show My Events for organizers */}
              {isOrganizer && (
                <Link 
                  to="/my-events" 
                  className="relative overflow-hidden bg-background text-foreground h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border-l-0 border border-foreground leading-none group"
                >
                  <span className="relative z-10">MY EVENTS</span>
                  <span className="absolute inset-0 bg-[hsl(300,100%,73%)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                </Link>
              )}

              {/* Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="relative overflow-hidden bg-background text-foreground h-[34px] w-[34px] flex items-center justify-center border-l-0 border border-foreground group"
                >
                  {userAvatar ? (
                    <img 
                      src={userAvatar} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="relative z-10 text-[11px] font-medium uppercase">
                      {userDisplayName.charAt(0)}
                    </span>
                  )}
                  <span className="absolute inset-0 bg-[hsl(300,100%,73%)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                </button>

                {/* Dropdown Menu */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-background border border-foreground shadow-lg z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-foreground">
                      <div className="flex items-center gap-3">
                        {userAvatar ? (
                          <img 
                            src={userAvatar} 
                            alt="Profile" 
                            className="w-10 h-10 rounded-full object-cover border border-foreground"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full border border-foreground flex items-center justify-center text-lg font-medium">
                            {userDisplayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {userDisplayName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {user?.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-[hsl(300,100%,73%)] transition-colors duration-200"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <span className="mr-3">👤</span>
                        Profile Settings
                      </Link>
                      
                      <Link
                        to="/tickets"
                        className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-[hsl(300,100%,73%)] transition-colors duration-200"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <span className="mr-3">🎫</span>
                        My Tickets
                      </Link>

                      {isOrganizer && (
                        <Link
                          to="/analytics"
                          className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-[hsl(300,100%,73%)] transition-colors duration-200"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <span className="mr-3">📊</span>
                          Analytics
                        </Link>
                      )}

                      <div className="border-t border-foreground my-1"></div>

                      <button
                        onClick={async () => {
                          await supabase.auth.signOut();
                          setIsProfileDropdownOpen(false);
                        }}
                        className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"
                      >
                        <span className="mr-3">🚪</span>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button 
              onClick={() => setIsAuthOpen(true)}
              className="relative overflow-hidden bg-background text-foreground h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border-l-0 border border-foreground leading-none group"
            >
              <span className="relative z-10">SIGN IN</span>
              <span className="absolute inset-0 bg-[hsl(300,100%,73%)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
            </button>
          )}
        </div>

        {/* Mobile Menu Button - Right Side */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden relative overflow-hidden bg-background text-foreground h-[34px] px-3 border border-foreground flex items-center justify-center text-[11px] font-medium uppercase leading-none group"
        >
          <span className="relative z-10">MENU</span>
          <span className="absolute inset-0 bg-[hsl(300,100%,73%)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[3000] flex flex-col animate-in slide-in-from-top duration-300">
          <div className="bg-foreground flex items-center justify-between px-6 py-4 animate-in fade-in duration-500">
            <span className="text-background text-sm font-medium">MENU</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-background text-[11px] font-medium uppercase tracking-wider">
              CLOSE
            </button>
          </div>
          <div className="flex-1 flex flex-col bg-background">
            {user && (
              <div className="px-6 py-4 border-b border-foreground flex items-center gap-3">
                {userAvatar ? (
                  <img 
                    src={userAvatar} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover border border-foreground"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border border-foreground flex items-center justify-center text-lg font-medium">
                    {userDisplayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{userDisplayName}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
            )}
            
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 flex items-center justify-center text-foreground text-[17px] font-medium uppercase border-b border-foreground tracking-[-0.34px] animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>DISCOVER</Link>
            
            {isOrganizer && (
              <button 
                onClick={() => { 
                  if (user) navigate('/create-event'); 
                  else { setPendingRoute('/create-event'); setIsAuthOpen(true); } 
                  setIsMobileMenuOpen(false); 
                }} 
                className="flex-1 flex items-center justify-center text-foreground text-[17px] font-medium uppercase border-b border-foreground tracking-[-0.34px] animate-fade-in" 
                style={{ animationDelay: '0.15s', animationFillMode: 'both' }}
              >
                CREATE EVENT
              </button>
            )}

            {user ? (
              <>
                <Link 
                  to={dashboardPath} 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="flex-1 flex items-center justify-center text-foreground text-[17px] font-medium uppercase border-b border-foreground tracking-[-0.34px] animate-fade-in" 
                  style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
                >
                  {dashboardLabel}
                </Link>

                {isOrganizer && (
                  <Link 
                    to="/my-events" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="flex-1 flex items-center justify-center text-foreground text-[17px] font-medium uppercase border-b border-foreground tracking-[-0.34px] animate-fade-in" 
                    style={{ animationDelay: '0.25s', animationFillMode: 'both' }}
                  >
                    MY EVENTS
                  </Link>
                )}

                <Link 
                  to="/profile" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="flex-1 flex items-center justify-center text-foreground text-[17px] font-medium uppercase border-b border-foreground tracking-[-0.34px] animate-fade-in" 
                  style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
                >
                  PROFILE
                </Link>

                <Link 
                  to="/tickets" 
                  onClick={() => setIsMobileMenuOpen(false)} 
                  className="flex-1 flex items-center justify-center text-foreground text-[17px] font-medium uppercase border-b border-foreground tracking-[-0.34px] animate-fade-in" 
                  style={{ animationDelay: '0.35s', animationFillMode: 'both' }}
                >
                  MY TICKETS
                </Link>

                <button 
                  onClick={async () => { 
                    await supabase.auth.signOut(); 
                    setIsMobileMenuOpen(false); 
                  }} 
                  className="flex-1 flex items-center justify-center text-red-600 text-[17px] font-medium uppercase tracking-[-0.34px] animate-fade-in" 
                  style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
                >
                  SIGN OUT
                </button>
              </>
            ) : (
              <button 
                onClick={() => { setIsAuthOpen(true); setIsMobileMenuOpen(false); }} 
                className="flex-1 flex items-center justify-center text-foreground text-[17px] font-medium uppercase tracking-[-0.34px] animate-fade-in" 
                style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
              >
                SIGN IN
              </button>
            )}
          </div>
        </div>
      )}
    
      <AuthSheet isOpen={isAuthOpen} onClose={() => { setIsAuthOpen(false); setPendingRoute(null); }} />
    </>,
    document.body
  );
};