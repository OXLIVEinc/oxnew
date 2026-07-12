import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Mail } from 'lucide-react';

/**
 * EventFooter
 * Signature element: a "departures board" marquee strip — a nod to event
 * tickets/boarding passes — scrolling live categories/genres. Sits above a
 * quiet, disciplined footer that matches the EventDetailPage system:
 * hairline rules, uppercase 11px labels, #1A1A1A ink, #FA76FF accent used
 * once, Host Grotesk type.
 */

const marqueeItems = [
  'MUSIC', 'COMEDY', 'ART & CULTURE', 'NIGHTLIFE', 'FOOD & DRINK',
  'SPORTS', 'WORKSHOPS', 'FILM', 'FASHION', 'TECH', 'THEATRE', 'FESTIVALS',
];

export const EventFooter: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-white text-[#1A1A1A] ">
      {/* Signature: scrolling ticket-strip marquee */}
      <div className="relative w-full overflow-hidden border-y border-[#1A1A1A] bg-[#1A1A1A] py-3">
        <div className="flex w-max animate-[marquee_28s_linear_infinite] gap-10 hover:[animation-play-state:paused]">
          {[...marqueeItems, ...marqueeItems].map((item, i) => (
            <span key={i} className="flex items-center gap-10 text-[11px] uppercase tracking-widest text-white/70">
              {item}
              <span className="text-[#FA76FF]">•</span>
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 py-14 lg:px-10">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-5">
          {/* Brand column */}
          <div className="col-span-2 flex flex-col gap-4 sm:col-span-3 lg:col-span-2">
            <span className="text-2xl font-bold tracking-tight">Ticketox</span>
            <p className="max-w-xs text-sm text-[#1A1A1A]/60">
              Find what's happening near you, and hold the door open for what's next.
            </p>
            <div className="mt-2 flex items-center gap-4">
              <a href="#" aria-label="Instagram" className="text-[#1A1A1A]/60 transition-colors hover:text-[#FA76FF]">
                <Instagram size={18} strokeWidth={1.5} />
              </a>
              <a href="#" aria-label="Twitter" className="text-[#1A1A1A]/60 transition-colors hover:text-[#FA76FF]">
                <Twitter size={18} strokeWidth={1.5} />
              </a>
              <a href="mailto:hello@discover.events" aria-label="Email" className="text-[#1A1A1A]/60 transition-colors hover:text-[#FA76FF]">
                <Mail size={18} strokeWidth={1.5} />
              </a>
            </div>
          </div>

          <FooterColumn
            label="Explore"
            links={[
              { label: 'Discover', to: '/discover' },
              { label: 'Categories', to: '/discover?tab=categories' },
              { label: 'Near me', to: '/discover?tab=nearby' },
              { label: 'This weekend', to: '/discover?tab=weekend' },
            ]}
          />
          <FooterColumn
            label="Host"
            links={[
              { label: 'Create an event', to: '/create' },
              { label: 'Pricing', to: '/pricing' },
              { label: 'Seating maps', to: '/venue-tools' },
              { label: 'Dashboard', to: '/dashboard' },
            ]}
          />
          <FooterColumn
            label="Company"
            links={[
              { label: 'About', to: '/about' },
              { label: 'Help center', to: '/help' },
              { label: 'Terms', to: '/terms' },
              { label: 'Privacy', to: '/privacy' },
            ]}
          />
        </div>

        <hr className="my-10 h-px w-full border-0 bg-[#1A1A1A]/15" />

        <div className="flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-center">
          <span className="text-[11px] uppercase tracking-widest text-[#1A1A1A]/50">
            © {year} ticketox — all rights reserved
          </span>
          <span className="text-[11px] uppercase tracking-widest text-[#1A1A1A]/50">
            Made for people who show up
          </span>
        </div>
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </footer>
  );
};

interface FooterColumnProps {
  label: string;
  links: { label: string; to: string }[];
}

const FooterColumn: React.FC<FooterColumnProps> = ({ label, links }) => (
  <div className="flex flex-col items-start gap-4">
    <h3 className="text-[11px] font-normal uppercase text-[#1A1A1A]/50">{label}</h3>
    <ul className="flex flex-col gap-3">
      {links.map((link) => (
        <li key={link.to}>
          <Link
            to={link.to}
            className="text-sm text-[#1A1A1A] transition-colors hover:text-[#FA76FF]"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);