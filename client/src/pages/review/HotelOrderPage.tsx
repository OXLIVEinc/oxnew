import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shell, CenterState } from '../../components/review/Shell';
import { Countdown } from '../../components/review/Countdown';
import { StubCard } from '../../components/review/StubCard';
import { fetchHotelOrder, payHotelOrder, type HotelOrder } from '../../lib/api/review';
import { Eyebrow, Title, Subtitle, Row, Divider, ErrorText, SectionCard, Field, PrimaryButton, Badge } from '../../components/review/ui';

const naira = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_COPY: Record<string, { label: string; badge: 'good' | 'pending' | 'bad' }> = {
  pending: { label: 'Awaiting review', badge: 'pending' },
  awaiting_payment: { label: 'Payment in progress', badge: 'pending' },
  paid: { label: 'Sent to hotel', badge: 'good' },
  confirmed: { label: 'Confirmed', badge: 'good' },
  declined: { label: 'Declined by hotel', badge: 'bad' },
  cancelled: { label: 'Cancelled', badge: 'bad' },
  completed: { label: 'Completed', badge: 'good' },
};

export default function HotelOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<HotelOrder | null>(null);
  const [hotelName, setHotelName] = useState('');
  const [hotelAddress, setHotelAddress] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    fetchHotelOrder(orderId)
      .then(({ order, hotelName, hotelAddress }) => {
        setOrder(order);
        setHotelName(hotelName);
        setHotelAddress(hotelAddress);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, [orderId]);

  if (loadError) {
    return (
      <Shell>
        <CenterState>
          <Title>We couldn't find this booking</Title>
          <Subtitle>{loadError}</Subtitle>
        </CenterState>
      </Shell>
    );
  }

  if (!order || !orderId) {
    return (
      <Shell>
        <CenterState>Loading your booking...</CenterState>
      </Shell>
    );
  }

  const isFree = Number(order.amount) === 0;
  const nights = order.nights;
  const statusMeta = STATUS_COPY[order.status] || { label: order.status, badge: 'pending' as const };

  if (order.status !== 'pending') {
    return (
      <Shell>
        <StubCard
          top={
            <>
              <Eyebrow>{hotelName}</Eyebrow>
              <Badge tone={statusMeta.badge}>{statusMeta.label}</Badge>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[#1A1A1A]/55">
                {order.status === 'paid' &&
                  "We've sent your request to the hotel. You'll get a confirmation on WhatsApp within 30 minutes."}
                {order.status === 'confirmed' && 'Your stay is confirmed. Show this on WhatsApp at check-in.'}
                {order.status === 'declined' &&
                  `Sorry, the hotel couldn't accommodate this request.${isFree ? '' : " You'll be refunded shortly."}`}
                {order.status === 'cancelled' && 'This booking was cancelled.'}
                {order.status === 'awaiting_payment' && "We're waiting on payment confirmation for this booking."}
              </p>
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
          <Title>This booking link has expired</Title>
          <Subtitle>Go back to WhatsApp and type MENU to book again.</Subtitle>
        </CenterState>
      </Shell>
    );
  }

  const handlePay = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await payHotelOrder(orderId, email.trim() || undefined);
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
      <StubCard
        top={
          <>
            <Eyebrow>Booking review</Eyebrow>
            <h1 className="mb-1.5 text-[22px] font-bold leading-tight tracking-tight text-[#1A1A1A]">{hotelName}</h1>
            <p className="text-[13.5px] text-[#1A1A1A]/50">{order.roomTypeName}</p>
            <p className="text-[13.5px] text-[#1A1A1A]/50">{hotelAddress}</p>
          </>
        }
        bottom={
          <>
            <Row label="Check-in" value={dateLabel(order.checkIn)} />
            <Row label="Check-out" value={dateLabel(order.checkOut)} />
            <Row label="Nights" value={nights} />
            <Row label="Guests" value={order.guests} />
            <Row label="Price per night" value={naira(Number(order.pricePerNight))} />
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

      {!isFree && (
        <SectionCard heading="Receipt email (optional)">
          <Field type="email" value={email} placeholder="name@example.com" onChange={(e) => setEmail(e.target.value)} />
        </SectionCard>
      )}

      {submitError && (
        <div className="mt-4">
          <ErrorText>{submitError}</ErrorText>
        </div>
      )}

      <div className="mt-5">
        <PrimaryButton disabled={submitting} onClick={handlePay}>
          {submitting ? 'Please wait...' : isFree ? 'Confirm free booking' : `Proceed to pay ${naira(Number(order.amount))}`}
        </PrimaryButton>
      </div>
      <p className="mt-3.5 text-center text-[12.5px] text-[#1A1A1A]/35">
        {isFree
          ? 'This booking will be sent straight to the hotel for confirmation.'
          : "You'll be redirected to Paystack to complete payment securely."}
      </p>
    </Shell>
  );
}
