import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Shell, CenterState } from '../../components/review/Shell';
import { Countdown } from '../../components/review/Countdown';
import { confirmTransferClaim, declineTransferClaim, fetchTransferClaim, type TicketInfo, type TransferInfo } from '../../lib/api/review';
import { Eyebrow, Title, Subtitle, Row, ErrorText, SectionCard, Field, PrimaryButton, GhostButton, InfoCard, InfoCardSection } from '../../components/review/ui';

export default function TransferClaimPage() {
  const { code } = useParams<{ code: string }>();
  const [transfer, setTransfer] = useState<TransferInfo | null>(null);
  const [ticket, setTicket] = useState<TicketInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState<'claim' | 'decline' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [justClaimed, setJustClaimed] = useState(false);
  const [justDeclined, setJustDeclined] = useState(false);

  useEffect(() => {
    if (!code) return;
    fetchTransferClaim(code)
      .then(({ transfer, ticket }) => {
        setTransfer(transfer);
        setTicket(ticket);
      })
      .catch((err: Error) => setLoadError(err.message));
  }, [code]);

  if (loadError) {
    return (
      <Shell>
        <CenterState>
          <Title>We couldn't find this transfer</Title>
          <Subtitle>{loadError}</Subtitle>
        </CenterState>
      </Shell>
    );
  }

  if (!transfer || !ticket || !code) {
    return (
      <Shell>
        <CenterState>Loading your ticket...</CenterState>
      </Shell>
    );
  }

  if (justClaimed || justDeclined) {
    return (
      <Shell>
        <InfoCard>
          <InfoCardSection>
            <Eyebrow>{ticket.eventName}</Eyebrow>
            <Title>{justClaimed ? 'Ticket claimed' : 'Transfer declined'}</Title>
            <Subtitle>
              {justClaimed
                ? "It's yours now — check your WhatsApp chat for your QR code."
                : "No problem — you've let the sender know you won't be taking this ticket."}
            </Subtitle>
            <div className="mt-6 border-t border-zinc-200 pt-4">
              <span className="font-mono text-sm text-zinc-400">Code: {transfer.transferCode}</span>
            </div>
          </InfoCardSection>
        </InfoCard>
      </Shell>
    );
  }

  if (transfer.status !== 'pending' || expired) {
    const isClaimed = transfer.status === 'claimed';
    const isDeclined = transfer.status === 'declined';
    const isCancelled = transfer.status === 'cancelled';
    return (
      <Shell>
        <InfoCard>
          <InfoCardSection>
            <Eyebrow>{ticket.eventName}</Eyebrow>
            <Title>
              {isClaimed && 'Ticket already claimed'}
              {isDeclined && 'Transfer declined'}
              {isCancelled && 'Transfer cancelled'}
              {!isClaimed && !isDeclined && !isCancelled && 'This link has expired'}
            </Title>
            <Subtitle>
              {isClaimed && 'This ticket has already been claimed and moved to a new owner.'}
              {isDeclined && "You've already declined this ticket."}
              {isCancelled && 'The sender cancelled this transfer before it was claimed.'}
              {!isClaimed && !isDeclined && !isCancelled && 'This transfer link is no longer valid. Ask the sender to send a new one.'}
            </Subtitle>
            <div className="mt-6 border-t border-zinc-200 pt-4">
              <span className="font-mono text-sm text-zinc-400">Code: {transfer.transferCode}</span>
            </div>
          </InfoCardSection>
        </InfoCard>
      </Shell>
    );
  }

  const handleClaim = async () => {
    setActionError(null);
    setBusy('claim');
    try {
      await confirmTransferClaim(code, fullName.trim(), email.trim());
      setJustClaimed(true);
    } catch (err) {
      setActionError((err as Error).message);
      setBusy(null);
    }
  };

  const handleDecline = async () => {
    setActionError(null);
    setBusy('decline');
    try {
      await declineTransferClaim(code);
      setJustDeclined(true);
    } catch (err) {
      setActionError((err as Error).message);
      setBusy(null);
    }
  };

  const canClaim = fullName.trim().length > 1 && /\S+@\S+\.\S+/.test(email);

  return (
    <Shell>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Claim form */}
        <div className="lg:w-7/12">
          <SectionCard heading="Claim this ticket">
            <Field
              id="fullName"
              label="Full name"
              value={fullName}
              placeholder="Full name"
              onChange={(e) => setFullName(e.target.value)}
            />
            <Field
              id="email"
              type="email"
              label="Email"
              value={email}
              placeholder="name@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </SectionCard>

          {actionError && (
            <div className="mt-4">
              <ErrorText>{actionError}</ErrorText>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-2.5">
            <PrimaryButton disabled={!canClaim || busy !== null} onClick={handleClaim}>
              {busy === 'claim' ? 'Claiming...' : 'Claim ticket'}
            </PrimaryButton>
            <GhostButton disabled={busy !== null} onClick={handleDecline}>
              {busy === 'decline' ? 'Declining...' : 'Decline'}
            </GhostButton>
          </div>
        </div>

        {/* Summary */}
        <div className="lg:w-5/12">
          <InfoCard>
            <InfoCardSection>
              <Eyebrow>Ticket transfer</Eyebrow>
              <Title>{ticket.eventName}</Title>
              <p className="text-[13.5px] text-zinc-500">{ticket.tierLabel}</p>
            </InfoCardSection>
            <div className="border-t border-zinc-200 px-6 py-4">
              <Row label="Sent to" value={transfer.recipientPhone} />
              <Row label="Transfer code" value={transfer.transferCode} mono />
              <div className="mt-2.5">
                <Countdown expiresAt={transfer.expiresAt} createdAt={transfer.createdAt} onExpire={() => setExpired(true)} />
              </div>
            </div>
          </InfoCard>
        </div>
      </div>
    </Shell>
  );
}