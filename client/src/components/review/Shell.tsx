import type { ReactNode } from 'react';

/** Small line-art ox mark, echoing the primary AnimatedOxLogo used elsewhere in the app. */
function OxMark() {
  return (
    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border-[1.5px] border-[#1A1A1A] bg-[#FA76FF]">
      <svg viewBox="0 0 64 64" className="h-6 w-6" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 28C8 18 6 10 14 8C18 7 20 12 22 18" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
        <path d="M52 28C56 18 58 10 50 8C46 7 44 12 42 18" stroke="#1A1A1A" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="32" cy="36" rx="16" ry="18" stroke="#1A1A1A" strokeWidth="4" />
        <circle cx="26" cy="32" r="2.4" fill="#1A1A1A" />
        <circle cx="38" cy="32" r="2.4" fill="#1A1A1A" />
        <path d="M28 42C28 46 36 46 36 42" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#FBF7F9] px-4 pb-16 pt-6">
      <header className="mb-7 flex w-full max-w-[440px] items-center gap-2.5 px-1">
        <OxMark />
        <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#1A1A1A]/45">
          OX Entertainment
        </span>
      </header>
      <main className="w-full max-w-[440px]">{children}</main>
    </div>
  );
}

export function CenterState({ children }: { children: ReactNode }) {
  return (
    <div className="w-full max-w-[440px] px-5 py-20 text-center text-[#1A1A1A]/55">
      {children}
    </div>
  );
}
