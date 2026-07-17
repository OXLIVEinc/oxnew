import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shell, CenterState } from '../../components/review/Shell';
import { Countdown } from '../../components/review/Countdown';
import { fetchCheckout, submitCheckout, type AttendeeItem, type EventInfo, type TicketOrder } from '../../lib/api/review';
import { Title, Subtitle } from '../../components/review/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, Users, Calendar, CreditCard, AlertCircle, Lock, ArrowRight, Loader2 } from 'lucide-react';

const naira = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });

// Loading Screen
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-white">
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-3 text-gray-600"
    >
      <Loader2 className="w-5 h-5 animate-spin" />
      <span>Getting your order ready...</span>
    </motion.div>
  </div>
);

export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<TicketOrder | null>(null);
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<AttendeeItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [focusedField, setFocusedField] = useState<number | null>(null);

  useEffect(() => {
    if (!orderId) return;
    fetchCheckout(orderId)
      .then(({ order, event }) => {
        setOrder(order);
        setEvent(event);
        const initial =
          order.items && order.items.length === order.quantity
            ? order.items.map((it) => ({
                attendeeName: it.attendeeName || '',
                attendeeEmail: it.attendeeEmail || '',
                tierId: it.tierId,
              }))
            : Array.from({ length: order.quantity }, () => ({ attendeeName: '', attendeeEmail: '' }));
        setAttendees(initial);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, [orderId]);

  if (!order || !event || !orderId) {
    return <LoadingScreen />;
  }

  if (loadError) {
    return (
      <Shell>
        <CenterState>
          <div className="flex flex-col items-center space-y-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <Title>We couldn't find this order</Title>
            <Subtitle>{loadError}</Subtitle>
          </div>
        </CenterState>
      </Shell>
    );
  }

  const isFree = Number(order.amount) === 0;

  if (order.status !== 'pending') {
    return (
      <Shell>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto px-4"
        >
          <div className="bg-white rounded-3xl border border-gray-200 p-8">
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                {event.title}
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                {order.status === 'awaiting_payment' && 'Payment in progress'}
                {order.status === 'paid' && 'Order complete 🎉'}
                {order.status === 'cancelled' && 'Order cancelled'}
                {!['awaiting_payment', 'paid', 'cancelled'].includes(order.status) && `Order ${order.status}`}
              </h2>
              <p className="text-gray-600">
                {order.status === 'paid'
                  ? 'Your tickets have already been sent to your WhatsApp chat.'
                  : order.status === 'awaiting_payment'
                    ? "We're waiting on payment confirmation for this order."
                    : 'This order can no longer be completed here. Type MENU on WhatsApp to start a new one.'}
              </p>
              <div className="pt-4 border-t border-gray-100">
                <span className="font-mono text-sm text-gray-400">Ref: {order.reference}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </Shell>
    );
  }

  if (expired) {
    return (
      <Shell>
        <CenterState>
          <div className="flex flex-col items-center space-y-4 text-center">
            <Clock className="w-12 h-12 text-amber-500" />
            <Title>This checkout link has expired</Title>
            <Subtitle>Go back to WhatsApp and type MENU to start a new order.</Subtitle>
          </div>
        </CenterState>
      </Shell>
    );
  }

  const updateAttendee = (index: number, field: keyof AttendeeItem, value: string) => {
    setAttendees((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  };

  const canSubmit = attendees.every((a) => a.attendeeName.trim() && /\S+@\S+\.\S+/.test(a.attendeeEmail));

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await submitCheckout(orderId, attendees);
      if (!result.free && result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
        return;
      }
      setOrder((prev) => (prev ? { ...prev, status: 'paid' } : prev));
    } catch (err) {
      setSubmitError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <div className="min-h-screen bg-white pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Mobile Summary */}
            <div className="lg:hidden mb-8">
              <EventSummary order={order} event={event} isFree={isFree} />
            </div>

            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
              {/* Attendee Form */}
              <div className="flex-1">
                <div className="bg-white border border-gray-200  shadow-sm p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-gray-700" />
                      <h2 className="text-2xl font-semibold text-gray-900">Attendee Details</h2>
                    </div>
                    <span className="text-sm font-medium text-gray-500 bg-gray-100 px-4 py-1.5 rounded-full">
                      {attendees.length} {attendees.length === 1 ? 'guest' : 'guests'}
                    </span>
                  </div>

                  <div className="space-y-6">
                    <AnimatePresence>
                      {attendees.map((attendee, i) => {
                        const tier = event.ticketTiers?.find((t) => t.id === attendee.tierId);
                        const isFocused = focusedField === i;

                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`p-6 rounded-2xl border transition-all duration-300 ${
                              isFocused
                                ? 'border-blue-500 shadow-md bg-blue-50/30'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold">
                                  {i + 1}
                                </div>
                                {tier && <span className="font-medium text-gray-700">{tier.name}</span>}
                              </div>
                              {tier && Number(tier.price) > 0 && (
                                <span className="text-sm font-semibold text-gray-900">
                                  {naira(Number(tier.price))}
                                </span>
                              )}
                            </div>

                            <div className="space-y-5">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={attendee.attendeeName}
                                  placeholder="Enter guest's full name"
                                  onChange={(e) => updateAttendee(i, 'attendeeName', e.target.value)}
                                  onFocus={() => setFocusedField(i)}
                                  onBlur={() => setFocusedField(null)}
                                  className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                  type="email"
                                  value={attendee.attendeeEmail}
                                  placeholder="guest@example.com"
                                  onChange={(e) => updateAttendee(i, 'attendeeEmail', e.target.value)}
                                  onFocus={() => setFocusedField(i)}
                                  onBlur={() => setFocusedField(null)}
                                  className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>

                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <span className="text-red-600 text-sm">{submitError}</span>
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={canSubmit && !submitting ? { scale: 1.01 } : {}}
                    whileTap={canSubmit && !submitting ? { scale: 0.985 } : {}}
                    disabled={!canSubmit || submitting}
                    onClick={handleSubmit}
                    className={`w-full mt-10 py-4 px-6 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-300 ${
                      canSubmit && !submitting
                        ? 'bg-gray-900 hover:bg-black text-white shadow-lg'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : isFree ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Register for Free
                        <ArrowRight className="w-5 h-5" />
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Pay {naira(Number(order.amount))}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>

                  <p className="mt-4 text-center text-sm text-gray-500">
                    {isFree
                      ? 'Your tickets will be sent to WhatsApp immediately after registration.'
                      : "You'll be redirected to Paystack to complete payment securely."}
                  </p>

                  <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Secure checkout</span>
                  </div>
                </div>
              </div>

              {/* Desktop Summary */}
              <div className="hidden lg:block w-full max-w-[26rem] shrink-0">
                <EventSummary order={order} event={event} isFree={isFree} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </Shell>
  );
}

// Event Summary Component
function EventSummary({ order, event, isFree }: { order: TicketOrder; event: EventInfo; isFree: boolean }) {
  return (
    <div className="bg-white border border-gray-200 p-6 lg:sticky lg:top-8 shadow-sm">
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
            <Calendar className="w-4 h-4" />
            <span className="uppercase tracking-wider text-xs">Event Details</span>
          </div>
          <h2 className="text-2xl font-semibold leading-tight text-gray-900">{event.title}</h2>

          <div className="mt-4 space-y-2.5 text-gray-600">
            <p className="flex items-start gap-2">
              <span className="text-xl mt-0.5">📅</span>
              <span>{dateLabel(event.startsAt)} · {timeLabel(event.startsAt)}</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-xl mt-0.5">📍</span>
              <span>{event.address}</span>
            </p>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Quantity</span>
            <span className="font-semibold text-gray-900">{order.quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Price per ticket</span>
            <span className="font-semibold text-gray-900">{naira(Number(order.unitPrice))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Subtotal</span>
            <span className="font-semibold text-gray-900">{naira(Number(order.subtotal))}</span>
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        <div className="flex items-end justify-between">
          <span className="text-lg font-semibold text-gray-900">Total</span>
          <span className="text-4xl font-bold text-gray-900">
            {isFree ? 'Free' : naira(Number(order.amount))}
          </span>
        </div>

        <div className="bg-gray-50 rounded-2xl p-4 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Reference</span>
            <span className="font-mono text-gray-700">{order.reference}</span>
          </div>
        </div>

        {order.expiresAt && (
          <Countdown
            expiresAt={order.expiresAt}
            createdAt={order.createdAt}
            onExpire={() => {}} // Empty for now - can be enhanced later
          />
        )}
      </div>
    </div>
  );
}