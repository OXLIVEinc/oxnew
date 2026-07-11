import { useEffect, useState } from 'react';

function format(msLeft: number): string {
  const totalSeconds = Math.max(0, Math.floor(msLeft / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Live countdown against `expiresAt`, with a shrinking progress bar.
 * Calls `onExpire` once, the moment it hits zero.
 */
export function Countdown({
  expiresAt,
  createdAt,
  onExpire,
}: {
  expiresAt: string;
  createdAt?: string;
  onExpire?: () => void;
}) {
  const expiry = new Date(expiresAt).getTime();
  const start = createdAt ? new Date(createdAt).getTime() : expiry - 30 * 60 * 1000;
  const total = Math.max(1, expiry - start);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const msLeft = expiry - now;

  useEffect(() => {
    if (msLeft <= 0) onExpire?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msLeft <= 0]);

  const fraction = Math.min(1, Math.max(0, msLeft / total));
  const urgent = msLeft <= 2 * 60 * 1000;
  const expired = msLeft <= 0;
  const dotColor = urgent ? 'bg-[#E23B3B]' : 'bg-[#FA76FF]';
  const timeColor = urgent ? 'text-[#E23B3B]' : 'text-[#1A1A1A]';
  const fillColor = urgent ? 'bg-[#E23B3B]' : 'bg-[#FA76FF]';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 font-mono">
        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotColor} animate-pulse`} />
        <span className="text-xs tracking-wide text-[#1A1A1A]/45">{expired ? 'Expired' : 'Time remaining'}</span>
        {!expired && <span className={`text-[13px] font-semibold tabular-nums ${timeColor}`}>{format(msLeft)}</span>}
      </div>
      <div className="relative h-[3px] w-full overflow-hidden rounded-full bg-[#1A1A1A]/8">
        <div
          className={`absolute inset-0 origin-left transition-transform duration-1000 ease-linear ${fillColor}`}
          style={{ transform: `scaleX(${fraction})` }}
        />
      </div>
    </div>
  );
}
