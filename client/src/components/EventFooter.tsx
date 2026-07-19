import React from "react";
import { Instagram, Twitter, Mail } from "lucide-react";
import { motion, type Variants } from "framer-motion";


const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const item: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};



export const EventFooter: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-gray-200 bg-white">
      <motion.div
        className="relative mx-auto max-w-[1400px] px-6 py-12 lg:px-10"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        {/* Header */}
        <motion.div
          variants={item}
          className="flex flex-wrap items-end justify-between gap-6 border-b border-dashed border-gray-300 pb-8"
        >
          <div>
            <motion.h2
              whileHover={{
                scale: 1.03,
              }}
              transition={{
                type: "spring",
                stiffness: 350,
              }}
              className="relative inline-block mt-2 text-3xl font-bold tracking-tighter text-gray-900"
            >
              Ticketox

              <motion.span
                animate={{
                  opacity: [0.25, 0.6, 0.25],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
                className="absolute inset-0 -z-10 rounded-full bg-[#FA76FF]/20 blur-2xl"
              />
            </motion.h2>
          </div>
        </motion.div>

        {/* Content */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 pb-12 pt-10 sm:grid-cols-3 lg:grid-cols-12">
          {/* Brand */}
          <motion.div variants={item} className="lg:col-span-5">
            <p className="max-w-md leading-relaxed text-gray-600">
              Find what's happening near you — and hold your spot before the
              doors close.
            </p>

            <div className="mt-8 flex items-center gap-5">
              {[
                {
                  icon: Instagram,
                  href: "#",
                  label: "Instagram",
                },
                {
                  icon: Twitter,
                  href: "#",
                  label: "Twitter",
                },
                {
                  icon: Mail,
                  href: "mailto:hello@ticketox.app",
                  label: "Email",
                },
              ].map(({ icon: Icon, href, label }, index) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  whileHover={{
                    y: -5,
                    scale: 1.15,
                    rotate: index % 2 === 0 ? 8 : -8,
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={{
                    type: "spring",
                    stiffness: 350,
                  }}
                  className="text-gray-400 transition-colors hover:text-[#FA76FF]"
                >
                  <Icon size={20} strokeWidth={1.8} />
                </motion.a>
              ))}
            </div>
          </motion.div>

        

         

       
        </div>

        {/* Bottom */}
        <motion.div
          variants={item}
          className="flex flex-col items-center justify-between gap-6 border-t border-dashed border-gray-300 pt-8 sm:flex-row"
        >
          <motion.span
            whileHover={{ scale: 1.03 }}
            className="text-center font-mono text-xs text-gray-400 sm:text-right"
          >
            © {year} Ticketox
          </motion.span>
        </motion.div>
      </motion.div>
    </footer>
  );
};

export default EventFooter;