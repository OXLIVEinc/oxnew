import type { ReactNode } from 'react';
import styles from './StubCard.module.css';

export function StubCard({ top, bottom }: { top: ReactNode; bottom: ReactNode }) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>{top}</div>
      <div className={styles.perforation} />
      <div className={styles.bottom}>{bottom}</div>
    </div>
  );
}
