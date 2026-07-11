import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shell, CenterState } from '../../components/review/Shell';
import { Countdown } from '../../components/review/Countdown';
import { fetchCheckout, submitCheckout, type AttendeeItem, type EventInfo, type TicketOrder } from '../../lib/api/review';
import { StubCard } from '../../components/review/StubCard';
import { Eyebrow, Title, Subtitle, Row, Divider, ErrorText, SectionCard, Field, PrimaryButton } from '../../components/review/ui';

const naira = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });

export default function CheckoutPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<TicketOrder | null>(null);
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<AttendeeItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    fetchCheckout(orderId)
      .then(({ order, event }) => {
        setOrder(order);
        setEvent(event);
        setAttendees(Array.from({ length: order.quantity }, () => ({ attendeeName: '', attendeeEmail: '' })));
      })
      .catch((err: Error) => setLoadError(err.message));
  }, [orderId]);

  if (loadError) {
    return (
      <Shell>
        <CenterState>
          <Title>We couldn't find this order</Title>
          <Subtitle>{loadError}</Subtitle>
        </CenterState>
      </Shell>
    );
  }

  if (!order || !event || !orderId) {
    return (
      <Shell>
        <CenterState>Loading your order...</CenterState>
      </Shell>
    );
  }

  const isFree = Number(order.amount) === 0;

  if (order.status !== 'pending') {
    return (
      <Shell>
        <StubCard
          top={
            <>
              <Eyebrow>{event.title}</Eyebrow>
              <Title>
                {order.status === 'awaiting_payment' && 'Payment in progress'}
                {order.status === 'paid' && 'Order complete'}
                {order.status === 'cancelled' && 'Order cancelled'}
                {!['awaiting_payment', 'paid', 'cancelled'].includes(order.status) && `Order ${order.status}`}
              </Title>
              <Subtitle>
                {order.status === 'paid'
                  ? 'Your tickets have already been sent to your WhatsApp chat.'
                  : order.status === 'awaiting_payment'
                    ? "We're waiting on payment confirmation for this order."
                    : 'This order can no longer be completed here. Type MENU on WhatsApp to start a new one.'}
              </Subtitle>
            </>
          }
          bottom={<span className="font-mono text-[13.5px] text-[#1A1A1A]/55">Ref: {order.reference}</span>}
        />
      </Shell>
    );
  }

  if (expired) {
    return (
      <Shell>
        <CenterState>
          <Title>This checkout link has expired</Title>
          <Subtitle>Go back to WhatsApp and type MENU to start a new order.</Subtitle>
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
      // Free event — registered directly, nothing more to do here.
      setOrder((prev) => (prev ? { ...prev, status: 'paid' } : prev));
    } catch (err) {
      setSubmitError((err as Error).message);
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <StubCard
        top={
          <>
            <Eyebrow>Ticket checkout</Eyebrow>
            <h1 className="mb-1.5 text-[22px] font-bold leading-tight tracking-tight text-[#1A1A1A]">{event.title}</h1>
            <p className="text-[13.5px] text-[#1A1A1A]/50">
              {dateLabel(event.startsAt)} · {timeLabel(event.startsAt)}
            </p>
            <p className="text-[13.5px] text-[#1A1A1A]/50">{event.address}</p>
          </>
        }
        bottom={
          <>
            <Row label="Quantity" value={order.quantity} />
            <Row label="Price per ticket" value={naira(Number(order.unitPrice))} />
            <Row label="Subtotal" value={naira(Number(order.subtotal))} />
            <Divider />
            <Row label="Total" value={isFree ? 'Free' : naira(Number(order.amount))} />
            <Row label="Reference" value={order.reference} mono />
            {order.expiresAt && (
              <div className="mt-2.5">
                <Countdown expiresAt={order.expiresAt} createdAt={order.createdAt} onExpire={() => setExpired(true)} />
              </div>
            )}
          </>
        }
      />

      <SectionCard heading="Attendee details">
        {attendees.map((attendee, i) => (
          <div key={i}>
            <Field
              id={`name-${i}`}
              label={`Guest ${i + 1} name`}
              value={attendee.attendeeName}
              placeholder="Full name"
              onChange={(e) => updateAttendee(i, 'attendeeName', e.target.value)}
            />
            <Field
              id={`email-${i}`}
              type="email"
              label={`Guest ${i + 1} email`}
              value={attendee.attendeeEmail}
              placeholder="name@example.com"
              onChange={(e) => updateAttendee(i, 'attendeeEmail', e.target.value)}
            />
          </div>
        ))}
      </SectionCard>

      {submitError && (
        <div className="mt-4">
          <ErrorText>{submitError}</ErrorText>
        </div>
      )}

      <div className="mt-5">
        <PrimaryButton disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? 'Please wait...' : isFree ? 'Register for free' : `Pay ${naira(Number(order.amount))}`}
        </PrimaryButton>
      </div>
      <p className="mt-3.5 text-center text-[12.5px] text-[#1A1A1A]/35">
        {isFree
          ? 'Your tickets will be sent to WhatsApp as soon as you register.'
          : "You'll be redirected to Paystack to complete payment securely."}
      </p>
    </Shell>
  );
}
