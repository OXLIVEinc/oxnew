import type { ReactNode } from 'react';
import styles from './Shell.module.css';

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.mark}>OX</div>
        <span className={styles.wordmark}>OX Entertainment</span>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

export function CenterState({ children }: { children: ReactNode }) {
  return <div className={styles.centerState}>{children}</div>;
}
