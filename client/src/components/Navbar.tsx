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
  const navigate = useNavigate();
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);

  useEffect(() => {
    if (user && pendingRoute) {
      navigate(pendingRoute);
      setPendingRoute(null);
      setIsAuthOpen(false);
    }
  }, [user, pendingRoute, navigate]);

  const dashboardPath = '/dashboard';

  const getDashboardLabel = () => {
    if (role === 'admin') return 'ADMIN';
    if (isOrganizer) return 'DASHBOARD';
    if (isHotelPartner) return 'PARTNER DASHBOARD';
    return 'MY DASHBOARD';
  };

  const dashboardLabel = getDashboardLabel();

  return createPortal(
    <>
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[2000] w-auto max-w-7xl px-4">
        <div className="bg-white/90 backdrop-blur-md shadow-[0_2px_16px_rgba(0,0,0,0.08)] rounded-full border border-gray-200/50 flex items-center gap-0.5 px-1.5 py-1.5">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors duration-200"
          >
            <img src={oxLogo} alt="OX Entertainment" className="w-7 h-7 object-contain" />
            <span className="text-sm font-semibold text-gray-800 tracking-tight">ox</span>
          </Link>

          <div className="w-px h-6 bg-gray-200 mx-1" />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-0.5">
            <Link 
              to="/" 
              className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-all duration-200"
            >
              Discover
            </Link>

            {isOrganizer && (
              <button 
                onClick={() => {
                  if (user) navigate('/create-event');
                  else { setPendingRoute('/create-event'); setIsAuthOpen(true); }
                }}
                className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-all duration-200"
              >
                Create Event
              </button>
            )}

            {user ? (
              <>
                <Link 
                  to={dashboardPath}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-all duration-200"
                >
                  {dashboardLabel}
                </Link>

                {isOrganizer && (
                  <Link 
                    to="/my-events" 
                    className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-all duration-200"
                  >
                    My Events
                  </Link>
                )}

                <div className="w-px h-6 bg-gray-200 mx-1" />

                <button 
                  onClick={async () => { await supabase.auth.signOut(); }}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-all duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <button 
                  onClick={() => setIsAuthOpen(true)}
                  className="px-5 py-1.5 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-full transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  Sign In
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-all duration-200"
          >
            Menu
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[3000] bg-white animate-in slide-in-from-top duration-300">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <span className="text-lg font-semibold text-gray-800">Menu</span>
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="p-2 hover:bg-gray-50 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-1">
              <Link 
                to="/" 
                onClick={() => setIsMobileMenuOpen(false)} 
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
              >
                Discover
              </Link>
              
              {isOrganizer && (
                <button 
                  onClick={() => { 
                    if (user) navigate('/create-event'); 
                    else { setPendingRoute('/create-event'); setIsAuthOpen(true); } 
                    setIsMobileMenuOpen(false); 
                  }} 
                  className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                >
                  Create Event
                </button>
              )}

              {user ? (
                <>
                  <Link 
                    to={dashboardPath} 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    {dashboardLabel}
                  </Link>

                  {isOrganizer && (
                    <Link 
                      to="/my-events" 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="block px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                    >
                      My Events
                    </Link>
                  )}

                  <div className="border-t border-gray-100 my-4" />

                  <button 
                    onClick={async () => { 
                      await supabase.auth.signOut(); 
                      setIsMobileMenuOpen(false); 
                    }} 
                    className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { setIsAuthOpen(true); setIsMobileMenuOpen(false); }} 
                  className="w-full text-left px-4 py-3 text-base font-medium text-white bg-black hover:bg-gray-800 rounded-xl transition-all shadow-sm mt-4"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AuthSheet isOpen={isAuthOpen} onClose={() => { setIsAuthOpen(false); setPendingRoute(null); }} />
    </>,
    document.body
  );
};