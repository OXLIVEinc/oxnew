import { useEffect, useState } from 'react';
import styles from './Countdown.module.css';

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

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <span className={`${styles.dot} ${urgent ? styles.dotUrgent : ''}`} />
        <span className={styles.label}>{expired ? 'Expired' : 'Time remaining'}</span>
        {!expired && <span className={`${styles.time} ${urgent ? styles.timeUrgent : ''}`}>{format(msLeft)}</span>}
      </div>
      <div className={styles.track}>
        <div
          className={`${styles.fill} ${urgent ? styles.fillUrgent : ''}`}
          style={{ transform: `scaleX(${fraction})` }}
        />
      </div>
    </div>
  );
}
