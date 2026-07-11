import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type PlanTier = 'on_demand' | 'basic' | 'advanced' | 'pro' | 'custom';

export interface Subscription {
  id: string;
  plan: PlanTier;
  status: string;
  billing_cycle: string;
  amount: number;
  currency: string;
  current_period_start: string | null;
  current_period_end: string | null;
}

const PLAN_LIMITS: Record<PlanTier, {
  events_per_month: number;
  guests_per_month: number;
  email_marketing: boolean;
  mobile_marketing: boolean;
  ticket_commission: number;
  priority_support: boolean;
  dedicated_manager: boolean;
}> = {
  on_demand: {
    events_per_month: Infinity,
    guests_per_month: 10000,
    email_marketing: false,
    mobile_marketing: false,
    ticket_commission: 5,
    priority_support: true,
    dedicated_manager: false,
  },
  basic: {
    events_per_month: 5,
    guests_per_month: 1000,
    email_marketing: true,
    mobile_marketing: false,
    ticket_commission: 1,
    priority_support: true,
    dedicated_manager: false,
  },
  advanced: {
    events_per_month: Infinity,
    guests_per_month: 10000,
    email_marketing: true,
    mobile_marketing: true,
    ticket_commission: 0.5,
    priority_support: true,
    dedicated_manager: false,
  },
  pro: {
    events_per_month: Infinity,
    guests_per_month: Infinity,
    email_marketing: true,
    mobile_marketing: true,
    ticket_commission: 0,
    priority_support: true,
    dedicated_manager: true,
  },
  custom: {
    events_per_month: Infinity,
    guests_per_month: Infinity,
    email_marketing: true,
    mobile_marketing: true,
    ticket_commission: 0,
    priority_support: true,
    dedicated_manager: true,
  },
};

// Prices in NGN (Nigerian Naira) — Paystack merchant only supports NGN
export const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  on_demand: { monthly: 0, annual: 0 },
  basic: { monthly: 35000, annual: Math.round(35000 * 12 * 0.88) },
  advanced: { monthly: 75000, annual: Math.round(75000 * 12 * 0.88) },
  pro: { monthly: 375000, annual: Math.round(375000 * 12 * 0.88) },
};

export function useSubscription(userId?: string) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetchSub = async () => {
      const { data } = await supabase
        .from('organizer_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setSubscription(data as Subscription | null);
      setLoading(false);
    };
    fetchSub();
  }, [userId]);

  const plan = (subscription?.plan || 'on_demand') as PlanTier;
  const limits = PLAN_LIMITS[plan];

  const canAccess = (feature: string): boolean => {
    switch (feature) {
      case 'email_marketing': return limits.email_marketing;
      case 'mobile_marketing': return limits.mobile_marketing;
      case 'campaigns': return limits.email_marketing;
      case 'analytics': return plan !== 'on_demand';
      case 'dedicated_manager': return limits.dedicated_manager;
      default: return true;
    }
  };

  const getUpgradePlan = (feature: string): PlanTier => {
    switch (feature) {
      case 'email_marketing':
      case 'campaigns':
        return 'basic';
      case 'mobile_marketing':
        return 'advanced';
      case 'analytics':
        return 'basic';
      case 'dedicated_manager':
        return 'pro';
      default:
        return 'basic';
    }
  };

  return { subscription, loading, plan, limits, canAccess, getUpgradePlan };
}
