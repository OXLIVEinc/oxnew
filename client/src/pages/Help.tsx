import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { EventFooter } from '@/components/EventFooter';
import { SEOHead } from '@/components/SEOHead';
import { motion, type Variants } from 'framer-motion';
import { 
  Mail, 
  MessageCircle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  Clock,
  Users,
  Calendar,
  Ticket,
  CreditCard,
} from 'lucide-react';

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
};

const CONTACT_EMAIL = 'info.oxentertainment@gmail.com';
const SUPPORT_HOURS = 'Monday - Friday, 9:00 AM - 6:00 PM EST';

interface FAQItem {
  question: string;
  answer: string;
  category: 'general' | 'tickets' | 'events' | 'payments' | 'account';
}

const faqs: FAQItem[] = [
  {
    category: 'general',
    question: 'What is Ticketox?',
    answer: 'Ticketox is a platform that empowers event creators and attendees. We make it easy to discover, create, and attend events — from intimate gatherings to large-scale productions. Our mission is to bring communities together through shared experiences.',
  },
  {
    category: 'general',
    question: 'Is Ticketox free to use?',
    answer: 'Creating an account and browsing events is completely free. We charge a small service fee on ticket sales to keep the platform running and continuously improving. Event organizers can choose from different pricing tiers based on their needs.',
  },
  {
    category: 'events',
    question: 'How do I create an event?',
    answer: 'To create an event, sign in to your Ticketox account and click "Create Event" in the navigation menu. Fill in your event details including title, description, date, time, location, and ticket pricing. You can upload images, set up multiple ticket tiers, and customize your event page. Review everything and publish — your event will be live for attendees to discover.',
  },
  {
    category: 'events',
    question: 'How do I manage my event as an organizer?',
    answer: 'From your Dashboard, you can track ticket sales, view attendee lists, edit event details, send updates to attendees, and access analytics. You\'ll also see real-time insights about your event\'s performance, audience engagement, and revenue.',
  },
  {
    category: 'tickets',
    question: 'How do I purchase tickets?',
    answer: 'Browse events on the Discover page, click on an event you\'re interested in, select your preferred ticket type and quantity. Proceed through our secure checkout process. After purchase, your tickets will be available in your account under "My Tickets" and you\'ll receive a confirmation email with QR codes for entry.',
  },
  {
    category: 'tickets',
    question: 'Can I transfer my tickets to someone else?',
    answer: 'Yes! You can transfer tickets to another person through your Ticketox account. Go to "My Tickets," select the event, and click "Transfer Ticket." Enter the recipient\'s email address and they\'ll receive an invitation to claim the ticket. This is perfect for gifting or splitting tickets with friends.',
  },
  {
    category: 'tickets',
    question: 'Can I get a refund for my tickets?',
    answer: 'Refund policies vary by event organizer. Each event\'s refund policy is clearly stated on the event page before purchase. If the event is canceled, you\'ll automatically receive a full refund. For other situations, please contact the event organizer directly or reach out to our support team at hello@ticketox.app.',
  },
  {
    category: 'payments',
    question: 'What payment methods are accepted?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express, Discover), as well as digital payment options like Apple Pay and Google Pay. All transactions are secure and encrypted with industry-standard SSL/TLS protocols.',
  },
  {
    category: 'payments',
    question: 'Is my payment information secure?',
    answer: 'Absolutely. We use Stripe as our payment processor, which is PCI-DSS Level 1 certified — the highest level of security certification in the payments industry. Your credit card information is never stored on our servers and is transmitted securely using bank-grade encryption.',
  },
  {
    category: 'account',
    question: 'How do I reset my password?',
    answer: 'Click "Sign In" and then "Forgot Password" on the login screen. Enter the email address associated with your account and we\'ll send you a password reset link. Follow the instructions in the email to create a new password.',
  },
  {
    category: 'account',
    question: 'How do I delete my account?',
    answer: 'To delete your account, go to Profile Settings and scroll to the bottom. Click "Delete Account" and confirm your decision. Please note that this action is permanent and cannot be undone. Any active tickets or event data will be removed.',
  },
];

const categoryIcons = {
  general: HelpCircle,
  tickets: Ticket,
  events: Calendar,
  payments: CreditCard,
  account: Users,
};

const categoryColors = {
  general: 'text-blue-500',
  tickets: 'text-green-500',
  events: 'text-purple-500',
  payments: 'text-orange-500',
  account: 'text-pink-500',
};

const Help: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  const filteredFAQs = selectedCategory 
    ? faqs.filter(faq => faq.category === selectedCategory)
    : faqs;

  const categories = Array.from(new Set(faqs.map(faq => faq.category)));

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title="Help Center | Ticketox"
        description="Get help with Ticketox — find answers to common questions, learn about our platform, and contact our support team."
        keywords="help, support, faq, ticketox, events, customer service"
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
          <div className="absolute bottom-20 left-[20%] w-32 md:w-64 h-32 md:h-64 rounded-full bg-[hsl(300,100%,73%)]/[0.03] blur-3xl" />
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
              Help
            </span>
            <span className="bg-[hsl(300,100%,73%)] text-foreground border border-foreground px-4 md:px-8 py-2 md:py-4 rounded-[20px] md:rounded-[40px] -ml-px inline-block">
              Center
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="text-base md:text-lg lg:text-xl text-foreground/80 max-w-2xl mx-auto leading-relaxed"
          >
            Find answers, get support, and make the most of your Ticketox experience.
          </motion.p>
        </motion.div>
      </section>

      {/* Quick Links Section */}
      <motion.div
        className="max-w-6xl mx-auto px-4 md:px-8 -mt-12 relative z-20"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div
          variants={item}
          className="grid grid-cols-2 gap-4"
        >
          {[
            {
              icon: MessageCircle,
              title: 'Contact Support',
              description: 'Email us for help',
              color: 'border-purple-500/20 hover:bg-purple-500/5',
              iconColor: 'text-purple-500',
              onClick: () => document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' }),
            },
            {
              icon: HelpCircle,
              title: 'FAQ',
              description: 'Frequently asked questions',
              color: 'border-pink-500/20 hover:bg-pink-500/5',
              iconColor: 'text-pink-500',
              onClick: () => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' }),
            },
          ].map((item) => (
            <button
              key={item.title}
              onClick={item.onClick}
              className={`border p-6 rounded-2xl text-center transition-all duration-300 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] ${item.color} group`}
            >
              <item.icon size={32} className={`mx-auto mb-3 ${item.iconColor} group-hover:scale-110 transition-transform duration-300`} />
              <h3 className="text-lg font-medium mb-1">{item.title}</h3>
              <p className="text-sm text-foreground/70">{item.description}</p>
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        id="faq-section"
        className="max-w-4xl mx-auto px-4 md:px-8 pb-20 md:pb-28 pt-16"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
      >
        <motion.div variants={item} className="mb-8">
          <h2 className="text-2xl md:text-3xl font-medium inline-block border-b-2 border-[hsl(300,100%,73%)] pb-1">
            Frequently Asked Questions
          </h2>
          <p className="text-foreground/70 mt-2">
            Browse by category or search for answers to common questions.
          </p>
        </motion.div>

        {/* Category Filters */}
        <motion.div variants={item} className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === null
                ? 'bg-foreground text-background'
                : 'border border-foreground/20 hover:border-foreground/50'
            }`}
          >
            All
          </button>
          {categories.map((category) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons];
            const color = categoryColors[category as keyof typeof categoryColors];
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  selectedCategory === category
                    ? 'bg-foreground text-background'
                    : 'border border-foreground/20 hover:border-foreground/50'
                }`}
              >
                <Icon size={16} className={selectedCategory === category ? 'text-background' : color} />
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            );
          })}
        </motion.div>

        {/* FAQ List */}
        <motion.div variants={item} className="space-y-3">
          {filteredFAQs.length === 0 ? (
            <p className="text-center text-foreground/70 py-8">
              No FAQs found for this category.
            </p>
          ) : (
            filteredFAQs.map((faq, index) => {
              const Icon = categoryIcons[faq.category as keyof typeof categoryIcons];
              const color = categoryColors[faq.category as keyof typeof categoryColors];
              return (
                <div
                  key={index}
                  className="border border-foreground/10 rounded-xl overflow-hidden transition-all duration-300 hover:border-[hsl(300,100%,73%)]"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center gap-3 p-5 text-left bg-background hover:bg-[hsl(300,100%,73%)]/5 transition-colors duration-200"
                  >
                    <Icon size={20} className={`${color} shrink-0`} />
                    <span className="text-base md:text-lg font-medium flex-1 pr-4">
                      {faq.question}
                    </span>
                    <span className="shrink-0 text-foreground/60">
                      {openFAQ === index ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </span>
                  </button>
                  {openFAQ === index && (
                    <div className="px-5 pb-5 pl-14">
                      <div className="pt-3 border-t border-foreground/10">
                        <p className="text-sm md:text-base text-foreground/80 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </motion.div>
      </motion.div>

      {/* Contact Section - No Form, Just Contact Info */}
      <motion.div
        id="contact-section"
        className="max-w-4xl mx-auto px-4 md:px-8 pb-20 md:pb-28"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
      >
        <motion.div
          variants={item}
          className="p-8 md:p-12 border border-foreground/20 rounded-3xl bg-[hsl(300,100%,73%)]/5 text-center"
        >
          <Mail size={48} className="mx-auto mb-4 text-[hsl(300,100%,73%)]" />
          <h3 className="text-2xl md:text-3xl font-medium mb-2">
            Still have questions?
          </h3>
          <p className="text-foreground/70 max-w-lg mx-auto mb-6">
            Our support team is here to help. Reach out to us directly via email.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-3 p-4 bg-background rounded-xl border border-foreground/10">
              <Mail size={20} className="text-[hsl(300,100%,73%)] shrink-0" />
              <div>
                <p className="text-xs text-foreground/50">Email</p>
                <a 
                  href={`mailto:${CONTACT_EMAIL}`} 
                  className="text-sm font-medium hover:text-[hsl(300,100%,73%)] transition-colors"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 p-4 bg-background rounded-xl border border-foreground/10">
              <Clock size={20} className="text-[hsl(300,100%,73%)] shrink-0" />
              <div>
                <p className="text-xs text-foreground/50">Support Hours</p>
                <p className="text-sm font-medium">{SUPPORT_HOURS}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-foreground/50 mt-6">
            We typically respond within 24 hours
          </p>
        </motion.div>
      </motion.div>

      <EventFooter />
    </div>
  );
};

export default Help;