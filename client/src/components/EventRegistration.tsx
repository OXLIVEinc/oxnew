import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';

interface TicketTier {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  sold: number;
  is_sold_out?: boolean;
}

interface Attendee {
  name: string;
  email: string;
  phone: string;
  tierId: string;
  tierName: string;
}

interface EventRegistrationProps {
  eventId: string;
  onRegister: () => void;
  isRegistered: boolean;
  className?: string;
  onAuthRequired?: () => void;
  targetDate?: Date;
  ticketTiers?: TicketTier[];
  selectedTierId?: string | null;
}

export const EventRegistration: React.FC<EventRegistrationProps> = ({ 
  eventId,
  onRegister, 
  isRegistered: initialIsRegistered,
  className = "",
  onAuthRequired,
  targetDate,
  ticketTiers = [],
  selectedTierId
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isRegistered, setIsRegistered] = useState(initialIsRegistered);
  const [loading, setLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const { toast } = useToast();

  // Always NGN
  const currencySymbol = '₦';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) checkRegistration(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkRegistration(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [eventId]);

  const checkRegistration = async (userId: string) => {
    const { data } = await supabase
      .from('event_registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();
    setIsRegistered(!!data);
  };

  const getEventStatus = () => {
    if (!targetDate) return 'upcoming';
    const now = new Date().getTime();
    const target = targetDate.getTime();
    const distance = target - now;
    const oneHour = 1000 * 60 * 60;
    if (distance < -oneHour) return 'ended';
    if (distance >= -oneHour && distance <= oneHour) return 'happening';
    return 'upcoming';
  };

  const eventStatus = getEventStatus();
  const isPastEvent = eventStatus === 'ended';

  const openBookingModal = () => {
    if (isPastEvent) {
      toast({ title: 'Event has ended', description: 'You cannot register for past events', variant: 'destructive' });
      return;
    }
    if (!user) {
      if (onAuthRequired) onAuthRequired();
      else toast({ title: 'Sign in required', description: 'Please sign in to register', variant: 'destructive' });
      return;
    }

    const defaultTier = ticketTiers.find(t => t.id === selectedTierId) || ticketTiers[0];
    if (defaultTier) {
      setAttendees([{
        name: user.user_metadata?.display_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        tierId: defaultTier.id,
        tierName: defaultTier.name,
      }]);
    } else {
      setAttendees([{
        name: user.user_metadata?.display_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        tierId: '',
        tierName: 'General',
      }]);
    }
    setShowBookingModal(true);
  };

  const addAttendee = () => {
    if (attendees.length >= 20) {
      toast({ title: 'Maximum reached', description: 'You can purchase up to 20 tickets per order', variant: 'destructive' });
      return;
    }
    const defaultTier = ticketTiers.find(t => t.id === selectedTierId) || ticketTiers[0];
    setAttendees([...attendees, {
      name: '',
      email: '',
      phone: '',
      tierId: defaultTier?.id || '',
      tierName: defaultTier?.name || 'General',
    }]);
  };

  const removeAttendee = (index: number) => {
    if (attendees.length <= 1) return;
    setAttendees(attendees.filter((_, i) => i !== index));
  };

  const updateAttendee = (index: number, field: keyof Attendee, value: string) => {
    const updated = [...attendees];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'tierId') {
      const tier = ticketTiers.find(t => t.id === value);
      updated[index].tierName = tier?.name || 'General';
    }
    setAttendees(updated);
  };

  const totalPrice = attendees.reduce((sum, a) => {
    const tier = ticketTiers.find(t => t.id === a.tierId);
    return sum + (tier?.price || 0);
  }, 0);

  const validateAttendees = (): boolean => {
    for (let i = 0; i < attendees.length; i++) {
      const a = attendees[i];
      if (!a.name.trim()) { toast({ title: 'Missing info', description: `Please enter name for attendee ${i + 1}`, variant: 'destructive' }); return false; }
      if (!a.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email)) { toast({ title: 'Invalid email', description: `Please enter a valid email for attendee ${i + 1}`, variant: 'destructive' }); return false; }
      if (!a.phone.trim()) { toast({ title: 'Missing phone', description: `Please enter phone for attendee ${i + 1}`, variant: 'destructive' }); return false; }
    }
    return true;
  };

  const handleFreeBooking = async () => {
    if (!user) return;
    if (!validateAttendees()) return;

    setLoading(true);
    try {
      const orderGroupId = crypto.randomUUID();

      if (!isRegistered) {
        const { error: regError } = await supabase
          .from('event_registrations')
          .insert({
            user_id: user.id,
            event_id: eventId,
            ticket_tier_id: attendees[0].tierId || null,
          });
        if (regError) throw regError;

        // Delete auto-created ticket from trigger
        const { data: autoTickets } = await supabase
          .from('tickets')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', eventId)
          .is('attendee_name', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (autoTickets && autoTickets.length > 0) {
          await supabase.from('tickets').delete().eq('id', autoTickets[0].id);
        }
      }

      const ticketsToInsert = attendees.map(a => ({
        event_id: eventId,
        user_id: user.id,
        qr_code: crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, ''),
        ticket_tier_id: a.tierId || null,
        attendee_name: a.name,
        attendee_email: a.email,
        attendee_phone: a.phone,
        order_group_id: orderGroupId,
      }));

      const { error: ticketError } = await supabase.from('tickets').insert(ticketsToInsert);
      if (ticketError) throw ticketError;

      // Update sold counts
      const tierCounts: Record<string, number> = {};
      attendees.forEach(a => {
        if (a.tierId) tierCounts[a.tierId] = (tierCounts[a.tierId] || 0) + 1;
      });
      for (const [tierId, count] of Object.entries(tierCounts)) {
        const tier = ticketTiers.find(t => t.id === tierId);
        if (tier) {
          await supabase.from('ticket_tiers').update({ sold: tier.sold + count }).eq('id', tierId);
        }
      }

      setIsRegistered(true);
      setShowBookingModal(false);
      onRegister();
      toast({
        title: `${attendees.length} free ticket${attendees.length > 1 ? 's' : ''} booked!`,
        description: 'Check your dashboard to view and download tickets.',
      });
    } catch (error: any) {
      toast({ title: 'Booking failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handlePaystackPayment = async () => {
    if (!user) return;
    if (!validateAttendees()) return;

    // Block zero-value or non-positive amounts
    if (!totalPrice || totalPrice <= 0) {
      toast({
        title: 'Payment could not be initialised',
        description: 'Payment could not be initialised. Please disable any VPN and try again.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('initiate-ticket-payment', {
        body: {
          email: user.email,
          amount: totalPrice,
          eventId,
          attendees: attendees.map(a => ({ name: a.name, email: a.email, phone: a.phone, tierId: a.tierId })),
          currency: 'NGN',
          callbackUrl: `${window.location.origin}/event/${eventId}?payment=verify`,
        },
      });

      if (error) throw error;
      if (data?.authorization_url) {
        sessionStorage.setItem('paystack_reference', data.reference);
        sessionStorage.setItem('paystack_event_id', eventId);
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No authorization URL returned');
      }
    } catch (error: any) {
      toast({ title: 'Payment failed', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Check for Paystack callback on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') || sessionStorage.getItem('paystack_reference');
    const storedEventId = sessionStorage.getItem('paystack_event_id');

    if (params.get('payment') === 'verify' && reference && storedEventId === eventId) {
      sessionStorage.removeItem('paystack_reference');
      sessionStorage.removeItem('paystack_event_id');
      window.history.replaceState({}, '', window.location.pathname);

      const verifyPayment = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase.functions.invoke('verify-ticket-payment', {
            body: { reference },
          });
          if (error) throw error;
          setIsRegistered(true);
          setShowBookingModal(false);
          onRegister();
          toast({
            title: 'Payment confirmed!',
            description: `${data.tickets} ticket(s) have been issued. Check your dashboard.`,
          });
        } catch (err: any) {
          toast({ title: 'Verification failed', description: err.message, variant: 'destructive' });
        } finally {
          setLoading(false);
        }
      };
      verifyPayment();
    }
  }, [eventId]);

  const handleBookTickets = () => {
    if (!user) return;
    if (totalPrice > 0) {
      handlePaystackPayment();
    } else {
      handleFreeBooking();
    }
  };

  return (
    <>
      <div className={`group flex items-center self-stretch relative overflow-hidden ${className}`}>
        <button 
          onClick={openBookingModal}
          disabled={loading || isPastEvent}
          className={`flex h-[50px] justify-center items-center gap-2.5 border relative px-2.5 py-3.5 border-solid transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed w-[calc(100%-50px)] z-10 ${
            isPastEvent 
              ? 'bg-muted-foreground border-muted-foreground cursor-not-allowed' 
              : 'bg-foreground border-foreground group-hover:w-full group-hover:bg-[hsl(300,100%,73%)] group-hover:border-[hsl(300,100%,73%)]'
          }`}
        >
          <span className={`text-background text-[13px] font-normal uppercase relative transition-colors duration-300 ${!isPastEvent && 'group-hover:text-foreground'}`}>
            {loading ? "LOADING..." : isPastEvent ? "EVENT ENDED" : isRegistered ? "BUY MORE TICKETS" : "GET TICKETS"}
          </span>
        </button>
        {!isPastEvent && (
          <div className="flex w-[50px] h-[50px] justify-center items-center border absolute right-0 bg-background rounded-full border-solid border-foreground transition-all duration-300 ease-in-out group-hover:opacity-0 group-hover:scale-50 pointer-events-none z-0">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M0.857178 6H10.3929" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6.39282 10L10.3928 6L6.39282 2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/60 p-4">
          <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
              <h2 className="text-lg font-medium">Book Tickets (max 20)</h2>
              <button onClick={() => setShowBookingModal(false)} className="p-1 hover:bg-muted rounded">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {attendees.map((attendee, index) => (
                <div key={index} className="border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-medium">Attendee {index + 1}</span>
                    {attendees.length > 1 && (
                      <button onClick={() => removeAttendee(index)} className="text-destructive hover:text-destructive/80">
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Full name *"
                    value={attendee.name}
                    onChange={(e) => updateAttendee(index, 'name', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-border focus:outline-none focus:border-foreground bg-background"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="email"
                      placeholder="Email *"
                      value={attendee.email}
                      onChange={(e) => updateAttendee(index, 'email', e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-border focus:outline-none focus:border-foreground bg-background"
                    />
                    <input
                      type="tel"
                      placeholder="Phone *"
                      value={attendee.phone}
                      onChange={(e) => updateAttendee(index, 'phone', e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-border focus:outline-none focus:border-foreground bg-background"
                    />
                  </div>
                  {ticketTiers.length > 0 && (
                    <select
                      value={attendee.tierId}
                      onChange={(e) => updateAttendee(index, 'tierId', e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-border focus:outline-none bg-background"
                    >
                      {ticketTiers.map(tier => {
                        const avail = tier.quantity - tier.sold;
                        const isSoldOut = tier.is_sold_out || avail <= 0;
                        return (
                          <option key={tier.id} value={tier.id} disabled={isSoldOut}>
                            {tier.name} — {tier.price > 0 ? `₦${tier.price}` : 'Free'} {isSoldOut ? '(Sold Out)' : `(${avail} left)`}
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              ))}

              <button
                onClick={addAttendee}
                disabled={attendees.length >= 20}
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Plus size={16} /> Add Another Attendee ({attendees.length}/20)
              </button>
            </div>

            <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">{attendees.length} ticket{attendees.length > 1 ? 's' : ''}</span>
                {totalPrice > 0 && <span className="text-lg font-medium ml-3">₦{totalPrice.toFixed(2)}</span>}
                {totalPrice === 0 && <span className="text-lg font-medium ml-3">Free</span>}
              </div>
              <button
                onClick={handleBookTickets}
                disabled={loading}
                className="bg-[hsl(300,100%,73%)] text-foreground px-8 py-3 text-[13px] uppercase font-semibold rounded-lg hover:bg-foreground hover:text-background transition-all disabled:opacity-50 active:scale-95"
              >
                {loading ? 'Processing...' : totalPrice > 0 ? 'Pay Now' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
