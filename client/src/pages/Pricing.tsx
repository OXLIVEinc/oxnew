import React, { useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { SEOHead } from '@/components/SEOHead';
import { Check } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: 'On-Demand',
    subtitle: 'One-time or occasional use',
    priceLabel: 'Free',
    priceNote: 'No recurring fee',
    features: [
      '10,000 guests per month',
      'Priority support',
      '3% payment gateway fee',
      '5% ticket commission',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Basic',
    subtitle: 'Occasional or small scale events',
    priceLabel: '₦35,000',
    priceNote: '/month',
    features: [
      '5 events per month',
      '1,000 guests per month',
      'Email marketing',
      'Priority support',
      '3% payment processing',
      '1% per ticket',
    ],
    cta: 'Start Basic',
    popular: false,
  },
  {
    name: 'Advanced',
    subtitle: 'Growing & professional organizers',
    priceLabel: '₦75,000',
    priceNote: '/month',
    features: [
      'Infinite events per month',
      '10,000 guests per month',
      'Email & mobile marketing',
      'Priority support',
      '3% payment processing',
      '0.5% per ticket',
    ],
    cta: 'Go Advanced',
    popular: true,
  },
  {
    name: 'Pro',
    subtitle: 'Large scale organizers',
    priceLabel: '₦375,000',
    priceNote: '/month',
    features: [
      'All Advanced features',
      'Unlimited events & guests',
      'Priority queue',
      'Dedicated support manager',
      '3% payment processing',
      '0% ticket commission',
    ],
    cta: 'Go Pro',
    popular: false,
  },
];

const Pricing = () => {
  const { user, isOrganizer, loading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect after role has finished loading
    if (!loading && user && !isOrganizer) {
      navigate('/guest-dashboard');
    }
  }, [user, isOrganizer, loading, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Pricing | OX Entertainment" description="Choose the perfect plan for your events. From free to enterprise." keywords="pricing, event plans, OX Entertainment" />
      <Navbar />

      <section className="pt-32 md:pt-40 pb-16 md:pb-24 px-4 md:px-8">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-medium mb-6 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
            <span className="border border-foreground px-4 md:px-6 py-2 md:py-3">Simple</span>
            <span className="bg-[hsl(300,100%,73%)] text-foreground border border-foreground px-4 md:px-6 py-2 md:py-3 rounded-[20px] md:rounded-[40px] -ml-px">pricing</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
            Scale your events with plans designed for every stage of growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative border p-6 flex flex-col animate-fade-in ${
                plan.popular
                  ? 'border-[hsl(300,100%,73%)] bg-[hsl(300,100%,73%)]/[0.03]'
                  : 'border-foreground'
              }`}
              style={{ animationDelay: `${0.3 + index * 0.1}s`, animationFillMode: 'both' }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[hsl(300,100%,73%)] text-foreground px-3 py-0.5 text-[10px] uppercase font-medium tracking-wider">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-1">{plan.name}</h3>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{plan.subtitle}</p>
              </div>
              <div className="mb-6">
                <span className="text-3xl md:text-4xl font-medium">{plan.priceLabel}</span>
                {plan.priceNote && <span className="text-muted-foreground text-sm ml-1">{plan.priceNote}</span>}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-[hsl(300,100%,73%)]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 text-[13px] uppercase font-medium border transition-colors ${
                  plan.popular
                    ? 'bg-foreground text-background border-foreground hover:bg-[hsl(300,100%,73%)] hover:text-foreground hover:border-[hsl(300,100%,73%)]'
                    : 'bg-background text-foreground border-foreground hover:bg-foreground hover:text-background'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Enterprise / Custom */}
        <div className="max-w-6xl mx-auto mt-8 border border-foreground p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'both' }}>
          <div>
            <h3 className="text-xl md:text-2xl font-medium mb-2">Custom / Licensing</h3>
            <p className="text-muted-foreground text-sm">Unlimited attendees, custom service, and dedicated infrastructure for enterprise events.</p>
          </div>
          <button className="bg-foreground text-background px-8 py-3 text-[13px] uppercase font-medium hover:bg-[hsl(300,100%,73%)] hover:text-foreground transition-colors whitespace-nowrap border border-foreground">
            Let's Talk
          </button>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
