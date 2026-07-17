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
    <section className="py-10 md:py-14 overflow-hidden bg-background">
      <h3 className="text-[11px] uppercase font-medium tracking-[0.3em] text-center text-muted-foreground mb-8">
        Trusted By
      </h3>

      {/* Single infinite marquee for all screen sizes */}
      <div className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="flex items-center gap-12 md:gap-24 w-max animate-marquee-scroll will-change-transform">
          {duplicated.map((brand, i) => (
            <img
              key={`${brand.name}-${i}`}
              src={brand.logo}
              alt={brand.name}
              className="h-12 md:h-14 w-auto object-contain opacity-100 transition-opacity duration-300 dark:invert"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  );
};