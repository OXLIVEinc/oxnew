import { TypewriterText } from "./TypewriterText";
import { useScroll, useTransform, motion } from "framer-motion";
import { useRef, useEffect, useState } from "react";

const Hero = () => {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  // Parallax
  const blob1Y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const blob2Y = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);

  // Dynamic Gradient Background
  const [gradient, setGradient] = useState("");

  useEffect(() => {
    const generateRandomGradient = () => {
      const hues = [260, 280, 300, 320, 340]; // Purple / Pink family
      const h1 = hues[Math.floor(Math.random() * hues.length)];
      const h2 = (h1 + 25 + Math.random() * 40) | 0;

      return `linear-gradient(135deg, 
        hsl(${h1}, 85%, 62%) 0%, 
        hsl(${h2}, 88%, 58%) 50%, 
        hsl(var(--primary)) 100%)`;
    };

    setGradient(generateRandomGradient());
  }, []);

  // Scroll to next section on button click
  const scrollToNext = () => {
    const nextSection = document.getElementById("next-section"); // Change ID as needed
    if (nextSection) {
      nextSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      // Fallback: scroll down by viewport height
      window.scrollTo({
        top: window.innerHeight * 2,
        behavior: "smooth",
      });
    }
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-[92vh] flex items-center pt-20 md:pt-24 lg:pt-32 pb-20 overflow-hidden"
    >
      {/* Dynamic Background Gradient Overlay */}
      <div
        className="absolute inset-0 opacity-10 transition-opacity duration-1000"
        style={{ background: gradient }}
      />

      {/* Ambient Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-[12%] -left-[8%] w-[480px] h-[480px] md:w-[700px] md:h-[700px] rounded-full bg-[hsl(var(--primary))]/8 blur-[130px]"
          style={{ y: blob1Y }}
        />
        <motion.div
          className="absolute top-[38%] right-[8%] w-[560px] h-[560px] md:w-[820px] md:h-[820px] rounded-full bg-[hsl(300,90%,68%)]/8 blur-[150px]"
          style={{ y: blob2Y }}
        />
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background to-transparent z-10" />

      <div className="relative z-20 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          style={{ y: contentY, opacity: contentOpacity }}
          className="space-y-10"
        >
          {/* Headline */}
          <h1 className="inline-flex mt-12 flex-col items-center gap-y-1 text-5xl sm:text-6xl md:text-[70px] lg:text-[80px] font-medium tracking-tighter leading-[1.05]">
            <div className="flex items-center gap-3">
              <span className="border border-foreground/70 px-6 py-4 rounded-3xl transition-all hover:border-foreground hover:bg-foreground/5">
                Discover
              </span>
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-[2.75rem] font-semibold shadow-xl shadow-purple-500/30 -skew-x-6 hover:skew-x-0 transition-all">
                events
              </span>
            </div>

            <div className="flex items-center gap-3 -mt-1">
              <span className="border border-foreground/70 px-6 py-4 rounded-3xl transition-all hover:border-foreground hover:bg-foreground/5">
                near
              </span>
              <span className="border border-l-0 border-foreground/70 px-6 py-4 rounded-r-3xl transition-all hover:border-foreground hover:bg-foreground/5">
                you
              </span>
            </div>
          </h1>

          {/* Subtitle */}
          <div className="max-w-xl mx-auto">
            <p className="text-lg md:text-xl text-foreground/75 font-light">
              <TypewriterText />
            </p>
          </div>

          {/* CTA Button */}
          <div className="pt-6">
            <button
              onClick={scrollToNext}
              className="group inline-flex items-center gap-3 rounded-full bg-foreground px-8 py-4 text-base font-semibold text-background transition-all duration-300 hover:scale-[1.02] hover:bg-black active:scale-[0.98] shadow-lg hover:shadow-xl"
            >
              <span>Explore events</span>

              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background/15 transition-transform duration-300 group-hover:translate-y-0.5">
                ↓
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
