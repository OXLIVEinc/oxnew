import type { ReactNode } from 'react';

/**
 * A physical event-ticket stub: a torn perforation with punched notches
 * separates the "what you're getting" half from the "what it costs" half —
 * the same split a paper ticket makes between its stub and receipt.
 */
export function StubCard({ top, bottom }: { top: ReactNode; bottom: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[22px] border-[1.5px] border-[#1A1A1A] bg-white shadow-[4px_4px_0_0_rgba(26,26,26,0.08)]">
      <div className="px-6 pb-5 pt-6">{top}</div>

      <div className="relative h-0 border-t-[1.5px] border-dashed border-[#1A1A1A]/25">
        <span className="absolute -left-[13px] -top-[13px] h-[26px] w-[26px] rounded-full border-[1.5px] border-[#1A1A1A] bg-[#FBF7F9]" />
        <span className="absolute -right-[13px] -top-[13px] h-[26px] w-[26px] rounded-full border-[1.5px] border-[#1A1A1A] bg-[#FBF7F9]" />
      </div>

      <div className="px-6 pb-6 pt-5">{bottom}</div>
    </div>
  );
}
