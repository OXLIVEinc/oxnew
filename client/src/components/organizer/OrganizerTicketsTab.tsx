import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface TicketInfo {
  id: string;
  qr_code: string;
  checked_in: boolean;
  event_title: string;
  event_date: string;
  event_time: string;
  event_address: string;
  attendee_name: string | null;
  tier_name: string | null;
}

async function downloadTicketImage(ticket: TicketInfo) {
  try {
    const response = await fetch(ticket.qr_code);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `ticket-${ticket.event_title
      .replace(/\s+/g, '-')
      .toLowerCase()}.png`;

    link.click();
    URL.revokeObjectURL(url);
  } catch {
    window.open(ticket.qr_code, '_blank');
  }
}

const TicketsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
    {Array.from({ length: 4 }).map((_, i) => (
      <div
        key={i}
        className="border border-border overflow-hidden"
      >
        <div className="aspect-[3/5] bg-muted" />
        <div className="h-12 bg-muted border-t border-border" />
      </div>
    ))}
  </div>
);

export const OrganizerTicketsTab: React.FC = () => {
  const { user } = useUserRole();

  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'active' | 'checked-in'>('active');

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;

    setLoading(true);

    const { data } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', user.id);

    const list: TicketInfo[] = (data || []).map((t: any) => ({
      id: t.id,
      qr_code: t.qr_code,
      checked_in: t.checked_in,
      event_title: t.events?.title || 'Unknown Event',
      event_date: t.events?.date || '',
      event_time: t.events?.time || '',
      event_address: t.events?.address || '',
      attendee_name: t.attendee_name,
      tier_name: t.ticket_tiers?.name || null,
    }));

    setTickets(list);
    setLoading(false);
  };

  const activeTickets = tickets.filter((t) => !t.checked_in);
  const checkedInTickets = tickets.filter((t) => t.checked_in);

  const displayedTickets =
    view === 'active' ? activeTickets : checkedInTickets;

  return (
    <div className="space-y-6">
      {/* Toggle */}
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

      {loading ? (
        <TicketsSkeleton />
      ) : tickets.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No tickets purchased yet.
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
  ticket: TicketInfo;
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
            src={ticket.qr_code}
            alt={ticket.event_title}
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