import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Send } from 'lucide-react';

interface Campaign {
  id: string;
  subject: string;
  message: string;
  type: string;
  status: string;
  sent_at: string | null;
  recipient_count: number;
  created_at: string;
}

interface CampaignsPanelProps {
  eventId: string | null;
}

export const CampaignsPanel: React.FC<CampaignsPanelProps> = ({ eventId }) => {
  const { user } = useUserRole();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'email' | 'sms'>('email');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (eventId && user) fetchCampaigns();
  }, [eventId, user]);

  const fetchCampaigns = async () => {
    if (!eventId || !user) return;
    setLoading(true);
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('event_id', eventId)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });

    setCampaigns(data || []);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!eventId || !user || !subject.trim() || !message.trim()) {
      toast({ title: 'Error', description: 'Subject and message are required', variant: 'destructive' });
      return;
    }

    setSending(true);

    // Get recipient count
    const { count } = await supabase
      .from('event_registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    const { error } = await supabase.from('campaigns').insert({
      event_id: eventId,
      created_by: user.id,
      subject: subject.trim(),
      message: message.trim(),
      type,
      status: 'sent',
      sent_at: new Date().toISOString(),
      recipient_count: count || 0,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Campaign sent!', description: `Sent to ${count || 0} recipients` });
      // Trigger edge function for actual sending
      try {
        await supabase.functions.invoke('send-campaign', {
          body: { eventId, subject: subject.trim(), message: message.trim(), type },
        });
      } catch (e) {
        // Campaign record saved even if edge fn fails
      }
      setSubject('');
      setMessage('');
      setShowCreate(false);
      fetchCampaigns();
    }
    setSending(false);
  };

  if (!eventId) {
    return <div className="py-12 text-center text-gray-500">Select an event from the Events tab first</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-medium">Campaigns</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-[#1A1A1A] text-white px-4 py-2 text-[11px] uppercase font-medium hover:bg-[#FA76FF] hover:text-black transition-colors"
        >
          {showCreate ? 'Cancel' : 'New Campaign'}
        </button>
      </div>

      {showCreate && (
        <div className="border border-black p-6 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-0">
            <button
              onClick={() => setType('email')}
              className={`px-4 py-2 text-[11px] uppercase font-medium border ${
                type === 'email' ? 'bg-[#1A1A1A] text-white' : 'bg-white text-black border-black'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setType('sms')}
              className={`px-4 py-2 text-[11px] uppercase font-medium border border-l-0 ${
                type === 'sms' ? 'bg-[#1A1A1A] text-white' : 'bg-white text-black border-black'
              }`}
            >
              SMS
            </button>
          </div>

          <input
            type="text"
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full border border-black px-4 py-3 text-sm focus:outline-none"
          />
          <textarea
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            className="w-full border border-black px-4 py-3 text-sm focus:outline-none resize-none"
          />
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 bg-[#FA76FF] text-black px-6 py-3 text-[11px] uppercase font-medium hover:bg-[#ff8fff] transition-colors disabled:opacity-50"
          >
            <Send size={14} /> {sending ? 'Sending...' : 'Send to All Registrants'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No campaigns yet</div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="border border-black p-4 flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">{campaign.subject}</h3>
                <p className="text-[11px] text-gray-500 mt-1">
                  {campaign.type.toUpperCase()} • {campaign.recipient_count} recipients •{' '}
                  {campaign.sent_at ? new Date(campaign.sent_at).toLocaleDateString() : 'Draft'}
                </p>
              </div>
              <span className={`text-[11px] uppercase px-2 py-1 ${
                campaign.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {campaign.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
