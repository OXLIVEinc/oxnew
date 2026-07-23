import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shell, CenterState } from '../../components/review/Shell';
import { Countdown } from '../../components/review/Countdown';
import { fetchCheckout, submitCheckout, type AttendeeItem, type EventInfo, type TicketOrder } from '../../lib/api/review';
import { Eyebrow, Title, Subtitle, Row, Divider, ErrorText, SectionCard, Field, PrimaryButton, InfoCard, InfoCardSection, Badge } from '../../components/review/ui';

const naira = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' });

const STATUS_COPY: Record<string, { label: string; tone: 'good' | 'pending' | 'bad' }> = {
  awaiting_payment: { label: 'Payment in progress', tone: 'pending' },
  paid: { label: 'Order complete', tone: 'good' },
  cancelled: { label: 'Order cancelled', tone: 'bad' },
  expired: { label: 'Order expired', tone: 'bad' },
};

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
        console.log(order)
        setEvent(event);
        const initial =
          order.items && order.items.length === order.quantity
            ? order.items.map((it) => ({
                attendeeName: it.attendeeName || '',
                attendeeEmail: it.attendeeEmail || '',
                tierId: it.tierId,
              }))
            : Array.from({ length: order.quantity }, () => ({
                attendeeName: '',
                attendeeEmail: '',
                tierId: order.tierId,
              }));
        setAttendees(initial);
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
        <CenterState>Getting your order ready...</CenterState>
      </Shell>
    );
  }

  const isFree = Number(order.amount) === 0;
  const isWeb = order.orderSource !== 'whatsapp';

  if (order.status !== 'pending') {
    const status = STATUS_COPY[order.status] ?? { label: order.status, tone: 'pending' as const };
    return (
      <Shell>
        <InfoCard>
          <InfoCardSection>
            <Eyebrow>{event.title}</Eyebrow>
            <div className="mb-3">
              <Badge tone={status.tone}>{status.label}</Badge>
            </div>
            <Subtitle>
              {order.status === 'paid' &&
                (isWeb
                  ? "You're all set — your tickets are ready."
                  : 'Your tickets have already been sent to your WhatsApp chat.')}
              {order.status === 'awaiting_payment' && "We're waiting on payment confirmation for this order."}
              {order.status === 'cancelled' && 'This order can no longer be completed here.'}
              {order.status === 'expired' &&
                (isWeb ? 'Please start a new order.' : 'Type MENU on WhatsApp to start a new order.')}
            </Subtitle>
            <div className="mt-4 border-t border-[#1A1A1A]/10 pt-4">
              <span className="font-mono text-[13px] text-[#1A1A1A]/50">Ref: {order.reference}</span>
            </div>
          </InfoCardSection>
        </InfoCard>
      </Shell>
    );
  }

  if (expired) {
    return (
      <Shell>
        <CenterState>
          <Title>This checkout link has expired</Title>
          <Subtitle>{isWeb ? 'Please start a new order.' : 'Go back to WhatsApp and type MENU to start a new order.'}</Subtitle>
        </CenterState>
      </Shell>
    );
  }

  const updateAttendee = (index: number, field: keyof AttendeeItem, value: string) => {
    setAttendees((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)));
  };

  const tierFor = (attendee: AttendeeItem) => event.ticketTiers?.find((t) => t.id === attendee.tierId);

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
      {/* Main content - flex on large screens */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">


         {/* Attendee Details */}
        <div className="lg:w-7/12">
        
          <SectionCard heading="Attendee details">
            {attendees.map((attendee, i) => {
              const tier = tierFor(attendee);
              return (
                <div key={i} className={i > 0 ? 'mt-4 border-t border-[#1A1A1A]/10 pt-4' : ''}>
                  <div className="mb-2.5 flex items-center justify-between">
                    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#1A1A1A]/45">
                      Attendee {i + 1}{tier ? ` — ${tier.name}` : ''}
                    </p>
                    {tier && Number(tier.price) > 0 && (
                      <span className="text-[12.5px] font-medium text-[#1A1A1A]">{naira(Number(tier.price))}</span>
                    )}
                  </div>
                  <Field
                    id={`name-${i}`}
                    label="Full name"
                    value={attendee.attendeeName}
                    placeholder="Full name"
                    onChange={(e) => updateAttendee(i, 'attendeeName', e.target.value)}
                  />
                  <Field
                    id={`email-${i}`}
                    type="email"
                    label="Email"
                    value={attendee.attendeeEmail}
                    placeholder="name@example.com"
                    onChange={(e) => updateAttendee(i, 'attendeeEmail', e.target.value)}
                  />
                </div>
              );
            })}
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
          <p className="mt-3.5 text-center text-[12px] text-[#1A1A1A]/35">
            {isFree
              ? isWeb
                ? 'Your ticket will be ready as soon as registration completes.'
                : 'This registration will be sent straight to WhatsApp.'
              : "You'll be redirected to Paystack to complete payment securely."}
          </p>
        </div>

        {/* Order Summary */}
        <div className="lg:w-5/12">
          <InfoCard>
            <InfoCardSection>
              <Eyebrow>Ticket checkout</Eyebrow>
              <Title>{event.title}</Title>
              <p className="text-[13.5px] text-[#1A1A1A]/50">{event.address}</p>
            </InfoCardSection>
            <div className="border-t border-[#1A1A1A]/10 px-5 py-4">
              <Row label="Date" value={`${dateLabel(event.startsAt)} · ${timeLabel(event.startsAt)}`} />
              <Row label="Quantity" value={order.quantity} />
              <Row label="Price per ticket" value={naira(Number(order.unitPrice))} />
              <Divider />
              <Row label="Subtotal" value={naira(Number(order.subtotal))} />
              <Row label="Total" value={isFree ? 'Free' : naira(Number(order.amount))} />
              <Row label="Reference" value={order.reference} mono />
              {order.expiresAt && (
                <div className="mt-2.5">
                  <Countdown expiresAt={order.expiresAt} createdAt={order.createdAt} onExpire={() => setExpired(true)} />
                </div>
              )}
            </div>
          </InfoCard>
        </div>

       
      </div>
    </Shell>
  );
}