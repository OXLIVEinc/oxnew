import React from 'react';
import oxBull from '@/assets/logos/ox-bull.jpg';
import monster from '@/assets/logos/monster.jpg';
import heineken from '@/assets/logos/heineken.jpg';
import stregis from '@/assets/logos/stregis.jpg';
import purly from '@/assets/logos/purly.jpg';
import jwMarriott from '@/assets/logos/jw-marriott.png';

const brands = [
  { name: 'OX Bull', logo: oxBull },
  { name: 'Monster', logo: monster },
  { name: 'Heineken', logo: heineken },
  { name: 'St. Regis', logo: stregis },
  { name: 'Purly', logo: purly },
  { name: 'JW Marriott', logo: jwMarriott },
];

export const TrustedByMarquee: React.FC = () => {
  // Triple the logos for seamless infinite loop
  const duplicated = [...brands, ...brands, ...brands];

  return (
    <section className="py-16 md:py-20 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block text-[11px] uppercase font-semibold tracking-[0.2em] text-gray-400">
            Trusted by industry leaders
          </span>
          <div className="h-px w-12 bg-gray-200 mx-auto mt-3" />
        </div>

        {/* Single infinite marquee for all screen sizes */}
        <div className="relative overflow-hidden">
          {/* Gradient fades */}
          <div className="absolute left-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 md:w-32 bg-gradient-to-l from-white to-transparent z-10" />
          
          {/* Marquee track */}
          <div className="flex items-center gap-16 md:gap-24 w-max animate-marquee-scroll will-change-transform">
            {duplicated.map((brand, i) => (
              <div
                key={`${brand.name}-${i}`}
                className="flex-shrink-0 group"
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="h-10 md:h-12 w-auto object-contain grayscale hover:grayscale-0 transition-all duration-500 ease-out opacity-60 hover:opacity-100"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Subtle bottom indicator */}
        <div className="flex justify-center gap-1.5 mt-8">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
        </div>
      </div>
    </section>
  );
};