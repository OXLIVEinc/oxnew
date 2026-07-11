import React, { useState, useEffect } from 'react';
import { useSubscription, PLAN_PRICES, PlanTier } from '@/hooks/useSubscription';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Check, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';

const plans = [
  {
    key: 'on_demand' as PlanTier,
    name: 'On-Demand',
    subtitle: 'One-time or occasional use',
    features: [
      '10,000 guests per month',
      'Priority support',
      '3% payment gateway fee',
      '5% ticket commission',
    ],
  },
  {
    key: 'basic' as PlanTier,
    name: 'Basic',
    subtitle: 'Occasional or small scale events',
    features: [
      '5 events per month',
      '1,000 guests per month',
      'Email marketing',
      'Priority support',
      '3% payment processing',
      '1% per ticket',
    ],
  },
  {
    key: 'advanced' as PlanTier,
    name: 'Advanced',
    subtitle: 'Growing & professional organizers',
    features: [
      'Infinite events per month',
      '10,000 guests per month',
      'Email & mobile marketing',
      'Priority support',
      '3% payment processing',
      '0.5% per ticket',
    ],
    popular: true,
  },
  {
    key: 'pro' as PlanTier,
    name: 'Pro',
    subtitle: 'Large scale organizers',
    features: [
      'All Advanced features',
      'Unlimited events & guests',
      'Priority queue',
      'Dedicated support manager',
      '3% payment processing',
      '0% ticket commission',
    ],
  },
];

const formatNGN = (amount: number) => {
  if (amount === 0) return 'Free';
  return `₦${amount.toLocaleString()}`;
};

export const SubscriptionPanel: React.FC = () => {
  const { user, authUser } = useAuth();
  const { subscription, plan: currentPlan, loading } = useSubscription(user?.id);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [subscribing, setSubscribing] = useState(false);
  const [searchParams] = useSearchParams();

  // Handle post-payment verification
  useEffect(() => {
    const payment = searchParams.get('payment');
    const reference = sessionStorage.getItem('sub_reference');
    if (payment === 'verify' && reference) {
      sessionStorage.removeItem('sub_reference');
      verifyPayment(reference);
    }
  }, [searchParams]);

  const verifyPayment = async (reference: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-subscription-payment', {
        body: { reference },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Successfully subscribed to ${data.plan?.replace('_', ' ')} plan!`);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error('Payment verification failed. Please contact support.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      toast.error('Could not verify payment. If you were charged, please contact support.');
    }
  };

  const handleSubscribe = async (planKey: PlanTier) => {
    if (!user) return;
    if (planKey === currentPlan) return;
    if (planKey === 'on_demand') {
      const { error } = await supabase
        .from('organizer_subscriptions')
        .update({ plan: 'on_demand', amount: 0 })
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (error) { toast.error('Failed to update plan'); return; }
      toast.success('Switched to On-Demand plan');
      window.location.reload();
      return;
    }

    setSubscribing(true);
    try {
      const price = billingCycle === 'annual'
        ? PLAN_PRICES[planKey].annual
        : PLAN_PRICES[planKey].monthly;

      const { data, error } = await supabase.functions.invoke('initiate-subscription-payment', {
        body: {
          email: authUser?.email,
          amount: price,
          plan: planKey,
          billingCycle,
          callbackUrl: `${window.location.origin}/organizer-dashboard?tab=subscription&payment=verify`,
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment initialization failed');
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.authorization_url) {
        sessionStorage.setItem('sub_reference', data.reference);
        window.location.href = data.authorization_url;
      } else {
        throw new Error('No payment URL received. Please try again.');
      }
    } catch (err: any) {
      console.error('Subscribe error:', err);
      toast.error(err.message || 'Payment initialization failed. Please try again or contact support.');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading subscription...</div>;

  const renewalDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="space-y-8">
      {/* Current Plan Card */}
      <div className="border border-border p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <Crown size={20} className="text-[hsl(300,100%,73%)]" />
          <h3 className="text-lg font-semibold">Current Plan</h3>
        </div>
        <p className="text-2xl font-bold capitalize">{currentPlan.replace('_', '-')}</p>
        {renewalDate && (
          <p className="text-sm text-muted-foreground mt-1">Renews on {renewalDate}</p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          Billing: <span className="capitalize">{subscription?.billing_cycle || 'N/A'}</span>
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setBillingCycle('monthly')}
          className={`px-4 py-2 text-sm font-medium border transition-colors ${
            billingCycle === 'monthly' ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border hover:border-foreground'
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle('annual')}
          className={`px-4 py-2 text-sm font-medium border transition-colors ${
            billingCycle === 'annual' ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground border-border hover:border-foreground'
          }`}
        >
          Annual <span className="text-[hsl(300,100%,73%)] text-xs ml-1">Save 12%</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {plans.map((p) => {
          const price = billingCycle === 'annual' ? PLAN_PRICES[p.key].annual : PLAN_PRICES[p.key].monthly;
          const isCurrent = p.key === currentPlan;
          return (
            <div
              key={p.key}
              className={`relative border p-5 flex flex-col rounded-lg ${
                p.popular ? 'border-[hsl(300,100%,73%)] bg-[hsl(300,100%,73%)]/[0.03]' : 'border-border'
              } ${isCurrent ? 'ring-2 ring-foreground' : ''}`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[hsl(300,100%,73%)] text-foreground px-3 py-0.5 text-[10px] uppercase font-medium tracking-wider rounded-sm">
                  Most Popular
                </div>
              )}
              <h4 className="text-base font-semibold">{p.name}</h4>
              <p className="text-[11px] text-muted-foreground mb-3">{p.subtitle}</p>
              <div className="mb-4">
                <span className="text-3xl font-bold">{formatNGN(price)}</span>
                {price > 0 && <span className="text-muted-foreground text-sm ml-1">/{billingCycle === 'annual' ? 'year' : 'month'}</span>}
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 mt-0.5 shrink-0 text-[hsl(300,100%,73%)]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(p.key)}
                disabled={isCurrent || subscribing}
                className={`w-full py-2.5 text-[12px] uppercase font-medium border transition-colors rounded ${
                  isCurrent
                    ? 'bg-muted text-muted-foreground border-border cursor-default'
                    : 'bg-foreground text-background border-foreground hover:bg-[hsl(300,100%,73%)] hover:text-foreground hover:border-[hsl(300,100%,73%)]'
                } disabled:opacity-50`}
              >
                {isCurrent ? 'Current Plan' : subscribing ? 'Processing...' : p.key === 'on_demand' ? 'Switch to Free' : 'Subscribe Now'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Enterprise */}
      <div className="border border-border p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 rounded-lg">
        <div>
          <h4 className="text-lg font-semibold">Custom / Licensing</h4>
          <p className="text-sm text-muted-foreground">Unlimited attendees, custom service, and dedicated infrastructure.</p>
        </div>
        <button className="bg-foreground text-background px-6 py-2.5 text-[12px] uppercase font-medium hover:bg-[hsl(300,100%,73%)] hover:text-foreground transition-colors border border-foreground whitespace-nowrap rounded">
          Let's Talk
        </button>
      </div>
    </div>
  );
};
