import type { InputHTMLAttributes, ReactNode } from 'react';

/** Small caps label that sits above a card's headline — e.g. "Ticket checkout". */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#FA76FF]">
      {children}
    </p>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <p className="mb-1 text-xl font-bold tracking-tight text-[#1A1A1A]">{children}</p>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-[13.5px] leading-relaxed text-[#1A1A1A]/55">{children}</p>;
}

export function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono">{children}</span>;
}

/** Label/value line used inside the ticket stub, e.g. "Quantity — 2". */
export function Row({ label, value, mono = false }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[7px] text-sm">
      <span className="text-[#1A1A1A]/50">{label}</span>
      <span className={`text-right font-medium text-[#1A1A1A] ${mono ? 'font-mono text-[13px]' : ''}`}>{value}</span>
    </div>
  );
}

export function Divider() {
  return <div className="my-3.5 border-t border-dashed border-[#1A1A1A]/15" />;
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="-mt-1.5 mb-3.5 text-[13px] text-[#E23B3B]">{children}</p>;
}

/** Boxed section beneath the stub — e.g. the attendee-details form. */
export function SectionCard({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div className="mt-4 rounded-2xl border border-[#1A1A1A]/10 bg-[#FBF7F9] px-4 pb-1 pt-4">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#1A1A1A]/45">{heading}</p>
      {children}
    </div>
  );
}

export function Field({
  label,
  ...props
}: { label?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-3.5 flex flex-col gap-1.5">
      {label && (
        <label htmlFor={props.id} className="text-xs tracking-wide text-[#1A1A1A]/50">
          {label}
        </label>
      )}
      <input
        {...props}
        className="rounded-xl border border-[#1A1A1A]/15 bg-white px-3.5 py-3 text-[14.5px] text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus:border-[#FA76FF] focus:outline-none focus:ring-2 focus:ring-[#FA76FF]/25 transition-colors"
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
      className="w-full rounded-xl bg-[#1A1A1A] px-5 py-3.5 text-[15px] font-semibold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:bg-[#FA76FF] enabled:hover:text-[#1A1A1A]"
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
      className="w-full rounded-xl border border-[#1A1A1A]/15 bg-transparent px-5 py-3.5 text-[15px] font-semibold text-[#1A1A1A]/60 transition-colors disabled:cursor-not-allowed disabled:opacity-40 enabled:hover:border-[#1A1A1A]/35 enabled:hover:text-[#1A1A1A]"
    >
      {children}
    </button>
  );
}

const BADGE_STYLES = {
  good: 'bg-[#E7F7EE] text-[#16A34A]',
  pending: 'bg-[#FFEFFC] text-[#D946C4]',
  bad: 'bg-[#FDECEC] text-[#E23B3B]',
} as const;

export function Badge({ tone, children }: { tone: keyof typeof BADGE_STYLES; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] ${BADGE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}
