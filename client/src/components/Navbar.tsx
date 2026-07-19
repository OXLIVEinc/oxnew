// src/components/Navbar.tsx
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AuthSheet } from './AuthSheet';
import oxLogo from '@/assets/ox-logo.jpg';
import { useAuth } from '@/context/AuthContext';


interface NavLinkItem {
  label: string;
  to?: string;
  href?: string;
}

const PRIMARY_LINKS: NavLinkItem[] = [
  { label: 'Discover', to: '/' },
  { label: 'About', to: '/about' },
  { label: 'Help', to: '/help' },
];
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

  const visibleLinks = user
  ? PRIMARY_LINKS.filter((item) => item.label === 'Discover')
  : PRIMARY_LINKS;

  const requireAuthThen = (path: string) => {
    if (user) navigate(path);
    else {
      setPendingRoute(path);
      setIsAuthOpen(true);
    }
  };

  const NavPill: React.FC<{
    item: NavLinkItem;
    onClick?: () => void;
    className?: string;
  }> = ({ item, onClick, className = '' }) => {
    const content = (
      <span className="relative z-10">{item.label.toUpperCase()}</span>
    );
    const shared =
      `relative overflow-hidden bg-background text-foreground h-[34px] px-3 flex items-center ` +
      `text-[11px] font-medium uppercase border-l-0 border border-foreground leading-none group ${className}`;
    const shine = (
      <span className="absolute inset-0 bg-[hsl(300,100%,73%)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
    );

    if (item.href) {
      return (
        <a href={item.href} onClick={onClick} className={shared}>
          {content}
          {shine}
        </a>
      );
    }
    return (
      <Link to={item.to!} onClick={onClick} className={shared}>
        {content}
        {shine}
      </Link>
    );
  };

  return createPortal(
    <>
      <nav className="fixed top-8 left-4 md:left-8 z-[2000] flex items-center gap-0">
        {/* Logo */}
        <div className="bg-background h-[34px] w-[34px] border border-foreground flex items-center justify-center overflow-hidden">
          <Link to="/">
            <img src={oxLogo} alt="OX Entertainment" className="w-6 h-6 object-contain" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center">
          {visibleLinks.map((item) => (
  <NavPill key={item.label} item={item} />
))}

          {isOrganizer && (
            <button
              onClick={() => requireAuthThen('/create-event')}
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
              {isOrganizer && (
                <Link
                  to="/my-events"
                  className="relative overflow-hidden bg-background text-foreground h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border-l-0 border border-foreground leading-none group"
                >
                  <span className="relative z-10">MY EVENTS</span>
                  <span className="absolute inset-0 bg-[hsl(300,100%,73%)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
                </Link>
              )}
              <button
                onClick={async () => { await supabase.auth.signOut(); }}
                className="relative overflow-hidden bg-background text-foreground h-[34px] px-3 flex items-center text-[11px] font-medium uppercase border-l-0 border border-foreground leading-none group"
              >
                <span className="relative z-10">SIGN OUT</span>
                <span className="absolute inset-0 bg-[hsl(300,100%,73%)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
              </button>
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

        {/* Mobile Navigation - Full Screen */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[3000] flex flex-col animate-in slide-in-from-top duration-300">
            <div className="bg-foreground flex items-center justify-center py-16 animate-in fade-in duration-500">
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-background text-[11px] font-medium uppercase tracking-wider">
                CLOSE
              </button>
            </div>
            <div className="flex-1 flex flex-col bg-background overflow-y-auto">
              {PRIMARY_LINKS.map((item, i) =>
                item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 flex items-center justify-center text-foreground text-[17px] font-medium uppercase border-b border-foreground tracking-[-0.34px] animate-fade-in"
                    style={{ animationDelay: `${0.1 + i * 0.05}s`, animationFillMode: 'both' }}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.to!}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex-1 flex items-center justify-center text-foreground text-[17px] font-medium uppercase border-b border-foreground tracking-[-0.34px] animate-fade-in"
                    style={{ animationDelay: `${0.1 + i * 0.05}s`, animationFillMode: 'both' }}
                  >
                    {item.label}
                  </Link>
                )
              )}

              {isOrganizer && (
                <button
                  onClick={() => { requireAuthThen('/create-event'); setIsMobileMenuOpen(false); }}
                  className="flex-1 flex items-center justify-center text-foreground text-[17px] font-medium uppercase border-b border-foreground tracking-[-0.34px] animate-fade-in"
                  style={{ animationDelay: '0.3s', animationFillMode: 'both' }}
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
                    style={{ animationDelay: '0.35s', animationFillMode: 'both' }}
                  >
                    {dashboardLabel}
                  </Link>
                  {isOrganizer && (
                    <Link
                      to="/my-events"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex-1 flex items-center justify-center text-foreground text-[17px] font-medium uppercase border-b border-foreground tracking-[-0.34px] animate-fade-in"
                      style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
                    >
                      MY EVENTS
                    </Link>
                  )}
                  <button
                    onClick={async () => { await supabase.auth.signOut(); setIsMobileMenuOpen(false); }}
                    className="flex-1 flex items-center justify-center text-foreground text-[17px] font-medium uppercase tracking-[-0.34px] animate-fade-in"
                    style={{ animationDelay: '0.45s', animationFillMode: 'both' }}
                  >
                    SIGN OUT
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setIsAuthOpen(true); setIsMobileMenuOpen(false); }}
                  className="flex-1 flex items-center justify-center text-foreground text-[17px] font-medium uppercase tracking-[-0.34px] animate-fade-in"
                  style={{ animationDelay: '0.35s', animationFillMode: 'both' }}
                >
                  SIGN IN
                </button>
              )}
            </div>
          </div>
        )}

        {/* Menu Button - Mobile Only */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden relative overflow-hidden bg-background text-foreground h-[34px] px-3 border border-l-0 border-foreground flex items-center justify-center text-[11px] font-medium uppercase leading-none group"
        >
          <span className="relative z-10">MENU</span>
          <span className="absolute inset-0 bg-[hsl(300,100%,73%)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></span>
        </button>
      </nav>

      {/* OX Logo - Top Right */}
      <div className="fixed top-8 right-4 md:right-8 z-[2000]">
        <Link to="/" className="block w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-foreground bg-background hover:scale-110 hover:shadow-lg transition-all duration-300 group">
          <img src={oxLogo} alt="OX" className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300" />
        </Link>
      </div>

      <AuthSheet isOpen={isAuthOpen} onClose={() => { setIsAuthOpen(false); setPendingRoute(null); }} />
    </>,
    document.body
  );
};