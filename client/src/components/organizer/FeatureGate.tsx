import React from 'react';
import { useSubscription, PlanTier } from '@/hooks/useSubscription';
import { useUserRole } from '@/hooks/useUserRole';
import { Lock, Zap } from 'lucide-react';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  onUpgrade?: () => void;
}

const PLAN_LABELS: Record<PlanTier, string> = {
  on_demand: 'On-Demand',
  basic: 'Basic',
  advanced: 'Advanced',
  pro: 'Pro',
  custom: 'Custom',
};

export const FeatureGate: React.FC<FeatureGateProps> = ({ feature, children, onUpgrade }) => {
  const { user } = useUserRole();
  const { canAccess, getUpgradePlan, loading } = useSubscription(user?.id);

  if (loading) return <>{children}</>;
  if (canAccess(feature)) return <>{children}</>;

  const requiredPlan = getUpgradePlan(feature);

  return (
    <div className="relative">
      <div className="opacity-20 pointer-events-none select-none blur-[2px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-background border border-border rounded-lg p-6 max-w-sm text-center shadow-lg">
          <Lock className="mx-auto mb-3 text-muted-foreground" size={28} />
          <h3 className="text-base font-semibold mb-1">Feature Locked</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This feature is available on the <strong>{PLAN_LABELS[requiredPlan]}</strong> plan and above.
          </p>
          <button
            onClick={onUpgrade}
            className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-[12px] uppercase font-medium hover:bg-[hsl(300,100%,73%)] hover:text-foreground transition-colors rounded"
          >
            <Zap size={14} />
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
};
