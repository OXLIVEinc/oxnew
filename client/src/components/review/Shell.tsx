import type { ReactNode } from 'react';
import Logo from '../../assets/ox-logo.jpg'
import { useNavigate } from 'react-router-dom'; // or your routing library
import {  ArrowLeft } from 'lucide-react';
export function Shell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/'); // or your home route
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-white px-4 pb-16 pt-6">
     <header className="mb-7 flex justify-between w-full max-w-[900px] mx-auto items-center gap-2.5 px-1">
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
          <ArrowLeft/>
        </button>
      </header>
      <main className="w-full max-w-[900px]">{children}</main>
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