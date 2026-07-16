import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { QRCodeSVG } from 'qrcode.react';
import { Download } from 'lucide-react';

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

export const OrganizerTicketsTab: React.FC = () => {
  const { user } = useUserRole();
  const [tickets, setTickets] = useState<TicketInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchTickets();
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('tickets')
      .select(`*`)
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

  if (loading) return <div className="py-12 text-center text-muted-foreground">Loading tickets...</div>;
  if (tickets.length === 0) return <div className="py-12 text-center text-muted-foreground">No tickets purchased yet. You can register for events from the Discover page.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {tickets.map((ticket) => (
        <div key={ticket.id} className="border border-border rounded-xl overflow-hidden" data-ticket-id={ticket.id}>
          <div className="bg-foreground text-background px-6 py-3 flex items-center justify-between">
            <span className={`text-[11px] uppercase px-2 py-0.5 rounded ${
              ticket.checked_in ? 'bg-green-500 text-white' : 'bg-background text-foreground'
            }`}>
              {ticket.checked_in ? '✓ Checked In' : 'Valid'}
            </span>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-4">
             <img src={ticket.qr_code} alt="" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
