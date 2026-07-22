import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useMyTickets } from '@/hooks/api/useGuestDashboard';
import type { GuestTicket } from '@/lib/api/types';

/**
 * src/components/guest/TicketsTab.tsx
 * -------------------------------------------------------------------------
 * The guest dashboard's "Tickets" tab. `ticket.qrCode` is now the URL of the
 * ticket card image rendered by the backend (server/lib/qr) at the moment
 * the ticket was created — it is rendered directly as an <img>, never
 * regenerated client-side.
 * -------------------------------------------------------------------------
 */

async function downloadTicketImage(ticket: GuestTicket) {
  try {
    const response = await fetch(ticket.qrCode);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${ticket.event.title
      .replace(/\s+/g, '-')
      .toLowerCase()}.png`;

    link.click();
    URL.revokeObjectURL(url);
  } catch {
    window.open(ticket.qrCode, '_blank');
  }
}

const TicketsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="border border-border overflow-hidden">
        <div className="aspect-[3/5] bg-muted" />
        <div className="h-12 bg-muted border-t border-border" />
      </div>
    ))}
  </div>
);

export const TicketsTab: React.FC = () => {
  const { data: tickets, isLoading } = useMyTickets();
  const [view, setView] = useState<'active' | 'checked-in'>('active');

  const activeTickets = tickets?.filter((t) => !t.checkedIn) ?? [];
  const checkedInTickets = tickets?.filter((t) => t.checkedIn) ?? [];

  const displayedTickets =
    view === 'active' ? activeTickets : checkedInTickets;

  return (
    <div className="space-y-6">
      {/* Always visible toggle */}
      <div className="flex w-fit border border-border">
        <button
          onClick={() => setView('active')}
          className={`px-4 py-2 text-[11px] uppercase font-medium transition-colors ${
            view === 'active'
              ? 'bg-foreground text-background'
              : 'bg-background hover:bg-muted'
          }`}
        >
          Active ({activeTickets.length})
        </button>

        <button
          onClick={() => setView('checked-in')}
          className={`px-4 py-2 text-[11px] uppercase font-medium border-l border-border transition-colors ${
            view === 'checked-in'
              ? 'bg-foreground text-background'
              : 'bg-background hover:bg-muted'
          }`}
        >
          Checked In ({checkedInTickets.length})
        </button>
      </div>

      {isLoading ? (
        <TicketsSkeleton />
      ) : !tickets || tickets.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No tickets yet. Register for events to get tickets.
        </div>
      ) : displayedTickets.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          {view === 'active'
            ? 'No active tickets.'
            : 'No checked-in tickets.'}
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${
            view === 'checked-in' ? 'opacity-50' : ''
          }`}
        >
          {displayedTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              drafted={view === 'checked-in'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const TicketCard: React.FC<{
  ticket: GuestTicket;
  drafted?: boolean;
}> = ({ ticket, drafted }) => {
  return (
    <div
      className={`border border-border overflow-hidden ${
        drafted ? 'grayscale' : ''
      }`}
    >
      <div className="text-center">
        <div className="border-t border-dashed border-border" />

        <div
          className={`flex justify-center mb-4 ${
            drafted ? 'opacity-30' : ''
          }`}
        >
          <img
            src={ticket.qrCode}
            alt={`Ticket QR for ${ticket.event.title}`}
            className="w-full max-w-full"
          />
        </div>

        {!drafted && (
          <button
            onClick={() => downloadTicketImage(ticket)}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background py-3 text-[11px] uppercase font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            <Download size={14} />
            Download Ticket
          </button>
        )}
      </div>
    </div>
  );
};