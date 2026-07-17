import type { ReactNode } from 'react';
import Logo from '../../assets/ox-logo.jpg'
import { useNavigate } from 'react-router-dom'; // or your routing library

export function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/'); // or your home route
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 pb-16 pt-6">
      <header className="mb-7 flex justify-between w-full max-w-[440px] mx-auto items-center gap-2.5 px-1">
        <div className="flex items-center gap-2.5">
          <img src={Logo} className='rounded-full w-[2rem] h-[2rem]' alt="" />
          <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#1A1A1A]/45">
            OX Entertainment
          </span>
        </div>
        <button 
          onClick={goHome}
          className="text-[#1A1A1A]/45 hover:text-[#1A1A1A] transition-colors duration-200"
          aria-label="Go to home"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </header>
      <main className="w-full ">{children}</main>
    </div>
  );
}

export function CenterState({ children }: { children: ReactNode }) {
  return (
    <div className="w-full  px-5 py-20 text-center text-[#1A1A1A]/55">
      {children}
    </div>
  );
}