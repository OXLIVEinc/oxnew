// src/pages/About.tsx
import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { EventFooter } from '@/components/EventFooter';
import { SEOHead } from '@/components/SEOHead';
import { motion, type Variants } from 'framer-motion';

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const About: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title="About | Ticketox"
        description="Learn about Ticketox — the platform built to empower events and bring communities together."
        keywords="about, ticketox, events, community, platform"
      />

      <div className="animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
        <Navbar />
      </div>

      {/* Hero Section */}
      <section className="pt-32 md:pt-40 lg:pt-48 pb-12 md:pb-20 lg:pb-28 px-4 md:px-8 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ transform: `translate3d(0, ${scrollY * 0.5}px, 0)` }}
        >
          <div className="absolute top-10 left-[5%] w-48 md:w-96 h-48 md:h-96 rounded-full bg-[hsl(var(--primary))]/[0.04] blur-3xl" />
          <div className="absolute top-32 right-[10%] w-64 md:w-[500px] h-64 md:h-[500px] rounded-full bg-[hsl(300,100%,73%)]/[0.04] blur-3xl" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent z-10" />

        <motion.div
          className="max-w-4xl mx-auto text-center relative z-20"
          variants={container}
          initial="hidden"
          animate="show"
          style={{
            transform: `translate3d(0, ${scrollY * -0.15}px, 0)`,
            opacity: Math.max(0, 1 - scrollY / 700),
          }}
        >
          <motion.h1
            variants={item}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium mb-6 md:mb-8"
          >
            <span className="border border-foreground px-4 md:px-8 py-2 md:py-4 inline-block">
              About
            </span>
            <span className="bg-[hsl(300,100%,73%)] text-foreground border border-foreground px-4 md:px-8 py-2 md:py-4 rounded-[20px] md:rounded-[40px] -ml-px inline-block">
              Ticketox
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="text-base md:text-lg lg:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed"
          >
            Built to empower events, amplify moments, and bring communities together.
          </motion.p>
        </motion.div>
      </section>

      {/* Content Sections */}
      <motion.div
        className="max-w-4xl mx-auto px-4 md:px-8 pb-20 md:pb-28"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
      >
        {/* Mission */}
        <motion.div
          variants={item}
          className="mb-16 md:mb-20"
        >
          <h2 className="text-2xl md:text-3xl font-medium mb-4 inline-block border-b-2 border-[hsl(300,100%,73%)] pb-1">
            Our Mission
          </h2>
          <p className="text-base md:text-lg text-foreground/80 leading-relaxed">
            Ticketox was created to make event discovery and ticketing seamless, accessible, and empowering for everyone. 
            We believe that every event has the power to connect people, spark joy, and create lasting memories. 
            Our platform is designed to help organizers bring their visions to life and help attendees find experiences that matter to them.
          </p>
        </motion.div>

        {/* What We Offer */}
        <motion.div
          variants={item}
          className="mb-16 md:mb-20"
        >
          <h2 className="text-2xl md:text-3xl font-medium mb-6 inline-block border-b-2 border-[hsl(300,100%,73%)] pb-1">
            What We Offer
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: 'For Organizers',
                description: 'Create, manage, and promote events with ease. Powerful tools to track sales, engage attendees, and grow your community.',
              },
              {
                title: 'For Attendees',
                description: 'Discover events near you, secure tickets instantly, and never miss out on the moments that matter most.',
              },
              {
                title: 'For Partners',
                description: 'Collaborate with event creators and venues to expand your reach and create unforgettable experiences.',
              },
              {
                title: 'For Communities',
                description: 'Bring people together around shared interests, causes, and passions. Every event is an opportunity to connect.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="border border-foreground p-6 rounded-2xl hover:bg-[hsl(300,100%,73%)]/5 transition-colors duration-300"
              >
                <h3 className="text-lg font-medium mb-2">{item.title}</h3>
                <p className="text-sm md:text-base text-foreground/70 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Values */}
        <motion.div
          variants={item}
          className="mb-16 md:mb-20"
        >
          <h2 className="text-2xl md:text-3xl font-medium mb-6 inline-block border-b-2 border-[hsl(300,100%,73%)] pb-1">
            Our Values
          </h2>
          <div className="flex flex-col gap-4">
            {[
              {
                title: 'Empowerment',
                description: 'We give creators and communities the tools they need to bring their visions to life.',
              },
              {
                title: 'Accessibility',
                description: 'Events should be easy to discover, easy to attend, and easy to love.',
              },
              {
                title: 'Community',
                description: 'We believe in the power of gathering — every ticket is a connection waiting to happen.',
              },
              {
                title: 'Innovation',
                description: 'We push boundaries to make event experiences better, smarter, and more memorable.',
              },
            ].map((value, index) => (
              <div
                key={value.title}
                className="flex items-start gap-4 border-b border-foreground/10 pb-4 last:border-0"
              >
                <span className="text-[hsl(300,100%,73%)] font-mono text-sm font-medium min-w-[24px]">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-lg font-medium">{value.title}</h3>
                  <p className="text-sm md:text-base text-foreground/70 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <EventFooter />
    </div>
  );
};

export default About;