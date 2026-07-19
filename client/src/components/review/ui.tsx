import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils'; // Optional: shadcn-style class merger

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.125em] text-zinc-500">
      {children}
    </p>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <h1 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-900">
      {children}
    </h1>
  );
}

export function Subtitle({ children }: { children: ReactNode }) {
  return (
    <p className="text-[15px] leading-relaxed text-zinc-600">
      {children}
    </p>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <hr className="h-px w-full bg-zinc-200" />
      <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {children}
      </h2>
    </div>
  );
}

export function Row({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between py-3 text-sm">
      <span className="text-zinc-500">{label}</span>
      <span
        className={cn(
          'font-medium text-zinc-900',
          mono && 'font-mono text-sm tabular-nums'
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function Divider() {
  return <div className="my-6 h-px w-full bg-zinc-200" />;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      {children}
    </div>
  );
}

/** Modern flat card — clean borders, subtle depth */
export function InfoCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      {children}
    </div>
  );
}

export function InfoCardSection({ children }: { children: ReactNode }) {
  return <div className="px-6 py-6">{children}</div>;
}

/** Boxed form section */
export function SectionCard({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {heading}
      </p>
      {children}
    </div>
  );
}

export function Field({
  label,
  ...props
}: { label?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-5 flex flex-col gap-2">
      {label && (
        <label
          htmlFor={props.id}
          className="text-xs font-medium text-zinc-500"
        >
          {label}
        </label>
      )}
      <input
        {...props}
        className={cn(
          'w-full rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-[15px] text-zinc-900',
          'placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900/70',
          'transition-all duration-200'
        )}
      />
    </div>
  );
}

export function PrimaryButton({
  children,
  disabled,
  ...props
}: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        'w-full rounded-2xl border border-zinc-900 bg-zinc-900 px-6 py-4 text-sm font-semibold uppercase tracking-wider text-white',
        'transition-all duration-200 hover:-translate-y-0.5 hover:bg-violet-600 hover:border-violet-600 active:scale-[0.985]',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0'
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  disabled,
  ...props
}: { children: ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        'w-full rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-sm font-semibold uppercase tracking-wider text-zinc-600',
        'transition-all hover:border-zinc-900 hover:text-zinc-900',
        'disabled:cursor-not-allowed disabled:opacity-50'
      )}
    >
      {children}
    </button>
  );
}

const BADGE_STYLES = {
  good: 'border-emerald-500 text-emerald-600 bg-emerald-50',
  pending: 'border-violet-500 text-violet-600 bg-violet-50',
  bad: 'border-red-500 text-red-600 bg-red-50',
} as const;

export function Badge({
  tone,
  children,
}: {
  tone: keyof typeof BADGE_STYLES;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest',
        BADGE_STYLES[tone]
      )}
    >
      {children}
    </span>
  );
}