import React from 'react';

interface AnimatedOxLogoProps {
  onClick?: () => void;
}

export const AnimatedOxLogo: React.FC<AnimatedOxLogoProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 cursor-pointer group"
      aria-label="Browse events"
    >
      <div className="relative w-16 h-16 md:w-20 md:h-20 animate-ox-breathe">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-foreground group-hover:border-[#FA76FF] transition-colors duration-300" />
        {/* Inner glow */}
        <div className="absolute inset-1 rounded-full bg-background group-hover:bg-[#FA76FF]/10 transition-colors duration-300 flex items-center justify-center">
          <svg
            viewBox="0 0 64 64"
            className="w-10 h-10 md:w-12 md:h-12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ox horns */}
            <path
              d="M12 28C8 18 6 10 14 8C18 7 20 12 22 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="text-foreground group-hover:text-[#FA76FF] transition-colors duration-300"
            />
            <path
              d="M52 28C56 18 58 10 50 8C46 7 44 12 42 18"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="text-foreground group-hover:text-[#FA76FF] transition-colors duration-300"
            />
            {/* Ox head */}
            <ellipse
              cx="32"
              cy="36"
              rx="16"
              ry="18"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-foreground group-hover:text-[#FA76FF] transition-colors duration-300"
            />
            {/* Eyes */}
            <circle cx="26" cy="32" r="2" fill="currentColor" className="text-foreground group-hover:text-[#FA76FF] transition-colors duration-300" />
            <circle cx="38" cy="32" r="2" fill="currentColor" className="text-foreground group-hover:text-[#FA76FF] transition-colors duration-300" />
            {/* Nose ring */}
            <path
              d="M28 42C28 46 36 46 36 42"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="text-foreground group-hover:text-[#FA76FF] transition-colors duration-300"
            />
            {/* Nostrils */}
            <circle cx="29" cy="40" r="1.5" fill="currentColor" className="text-foreground group-hover:text-[#FA76FF] transition-colors duration-300" />
            <circle cx="35" cy="40" r="1.5" fill="currentColor" className="text-foreground group-hover:text-[#FA76FF] transition-colors duration-300" />
          </svg>
        </div>
        {/* Scroll indicator arrow */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 animate-bounce">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-foreground group-hover:text-[#FA76FF] transition-colors duration-300" />
          </svg>
        </div>
      </div>
    </div>
  );
};
