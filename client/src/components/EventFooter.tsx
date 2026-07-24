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
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

export const EventFooter = () => {
  const year = new Date().getFullYear();

  const socials = [
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Mail, href: "mailto:hello@ticketox.app", label: "Email" },
  ];

  return (
    <footer className="border-t border-gray-200 bg-white">
      <motion.div
        className="mx-auto max-w-[1700px] px-6 py-8"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:items-end md:text-left">
          {/* Left Side */}
          <motion.div variants={item}>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Ticketox
            </h2>

            

            <div className="mt-4 flex justify-center gap-5 md:justify-start">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-gray-400 transition-colors hover:text-[#FA76FF]"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Right Side */}
         <motion.div variants={item} className="flex gap-3 flex-col">
           <p className="mt-1 text-sm text-gray-500">
              Discover events. Book tickets.
            </p>
          <p
            className="text-xs text-gray-400 md:text-right"
          >
            © {year} Ticketox. All rights reserved.
          </p>
         </motion.div>
      </div>
      </motion.div>
    </footer>
  );
};