import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createEventOrder } from '@/lib/api/registrations';
import { getApiErrorMessage } from '@/lib/api/http';
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

interface AttendeeSelection {
  tierId: string;
  tierName: string;
}

interface EventRegistrationProps {
  eventId: string;
  isPaid: boolean;
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
  selectedTierId,
}) => {
  const { authUser: user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isRegistered, setIsRegistered] = useState(initialIsRegistered);
  const [loading, setLoading] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [attendees, setAttendees] = useState<AttendeeSelection[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.id) { setIsRegistered(false); return; }
    checkRegistration(user.id);
  }, [user?.id, eventId]);

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
    const now = Date.now();
    const distance = targetDate.getTime() - now;
    const oneHour = 1000 * 60 * 60;
    if (distance < -oneHour) return 'ended';
    if (distance >= -oneHour && distance <= oneHour) return 'happening';
    return 'upcoming';
  };

  const eventStatus = getEventStatus();
  const isPastEvent = eventStatus === 'ended';

  const defaultTier = () => ticketTiers.find((t) => t.id === selectedTierId) || ticketTiers[0];

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

    const tier = defaultTier();
    setAttendees([{ tierId: tier?.id || '', tierName: tier?.name || 'General' }]);
    setShowBookingModal(true);
  };

  const addAttendee = () => {
    if (attendees.length >= 20) {
      toast({ title: 'Maximum reached', description: 'You can select up to 20 tickets per order', variant: 'destructive' });
      return;
    }
    const tier = defaultTier();
    setAttendees((prev) => [...prev, { tierId: tier?.id || '', tierName: tier?.name || 'General' }]);
  };

  const removeAttendee = (index: number) => {
    if (attendees.length <= 1) return;
    setAttendees((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAttendeeTier = (index: number, tierId: string) => {
    const tier = ticketTiers.find((t) => t.id === tierId);
    setAttendees((prev) => prev.map((a, i) => (i === index ? { tierId, tierName: tier?.name || 'General' } : a)));
  };

  const totalPrice = attendees.reduce((sum, a) => {
    const tier = ticketTiers.find((t) => t.id === a.tierId);
    return sum + (tier?.price || 0);
  }, 0);

  const handleBookTickets = async () => {
    if (!user) return;
    if (attendees.some((a) => !a.tierId)) {
      toast({ title: 'Select a ticket type', description: 'Please choose a ticket for every attendee', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const order = await createEventOrder({
        eventId,
        selections: attendees.map((a) => ({ tierId: a.tierId })),
      });
      setShowBookingModal(false);
      onRegister();
      navigate(`/checkout/${order.id}`);
    } catch (error: any) {
      toast({ title: 'Booking failed', description: getApiErrorMessage(error, error.message), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`group flex items-center self-stretch relative overflow-hidden ${className}`}>
        <button
          onClick={openBookingModal}
          disabled={loading || authLoading || isPastEvent}
          className={`flex h-[50px] justify-center items-center gap-2.5 border relative px-2.5 py-3.5 border-solid transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed w-[calc(100%-50px)] z-10 ${
            isPastEvent
              ? 'bg-muted-foreground border-muted-foreground cursor-not-allowed'
              : 'bg-foreground border-foreground group-hover:w-full group-hover:bg-[hsl(300,100%,73%)] group-hover:border-[hsl(300,100%,73%)]'
          }`}
        >
          <span className={`text-background text-[13px] font-normal uppercase relative transition-colors duration-300 ${!isPastEvent && 'group-hover:text-foreground'}`}>
            {loading || authLoading ? "LOADING..." : isPastEvent ? "EVENT ENDED" : isRegistered ? "BUY MORE TICKETS" : "GET TICKETS"}
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

      {showBookingModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-foreground/60 p-4">
          <div className="bg-background w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
              <h2 className="text-lg font-medium">Select Tickets (max 20)</h2>
              <button onClick={() => setShowBookingModal(false)} className="p-1 hover:bg-muted rounded">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Each attendee can have their own ticket type — choose the ticket, then enter names & pay on the next screen.
              </p>

              {attendees.map((attendee, index) => (
                <div key={index} className="border border-border p-4 space-y-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-medium">Ticket {index + 1}</span>
                    {attendees.length > 1 && (
                      <button onClick={() => removeAttendee(index)} className="text-destructive hover:text-destructive/80">
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {ticketTiers.length > 0 && (
                    <select
                      value={attendee.tierId}
                      onChange={(e) => updateAttendeeTier(index, e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-border focus:outline-none bg-background rounded"
                    >
                      {ticketTiers.map((tier) => {
                        const avail = tier.quantity - tier.sold;
                        const isSoldOut = tier.is_sold_out || (tier.quantity > 0 && avail <= 0);
                        return (
                          <option key={tier.id} value={tier.id} disabled={isSoldOut}>
                            {tier.name} — {tier.price > 0 ? `₦${tier.price}` : 'Free'}{' '}
                            {isSoldOut ? '(Sold Out)' : ''}
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
                className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 rounded"
              >
                <Plus size={16} /> Add Another Ticket ({attendees.length}/20)
              </button>
            </div>

            <div className="sticky bottom-0 bg-background border-t border-border px-6 py-4 flex items-center justify-between rounded-b-xl">
              <div>
                <span className="text-sm text-muted-foreground">
                  {attendees.length} ticket{attendees.length > 1 ? 's' : ''}
                </span>
                {totalPrice > 0 ? (
                  <span className="text-lg font-medium ml-3">₦{totalPrice.toFixed(2)}</span>
                ) : (
                  <span className="text-lg font-medium ml-3">Free</span>
                )}
              </div>

              <button
                onClick={handleBookTickets}
                disabled={loading}
                className="bg-[hsl(300,100%,73%)] text-foreground px-8 py-3 text-[13px] uppercase font-semibold rounded-lg hover:bg-foreground hover:text-background transition-all disabled:opacity-50 active:scale-95"
              >
                {loading ? 'Processing...' : 'Continue to review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};