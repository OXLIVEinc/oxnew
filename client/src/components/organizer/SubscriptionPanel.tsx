// client/src/components/organizer/SubscriptionPanel.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown } from "lucide-react";
import { useOrganizerSubscription, useSwitchToFreePlan } from "@/hooks/api/useOrganizer";
import { PLAN_PRICES } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Skeleton } from "../ui/skeleton";

const PLANS = [
  { key: "on_demand", name: "On-Demand", features: ["10,000 guests/month", "5% ticket commission"] },
  { key: "basic", name: "Basic", features: ["5 events/month", "Email marketing", "1% per ticket"] },
  { key: "advanced", name: "Advanced", features: ["Unlimited events", "Email & mobile marketing", "0.5% per ticket"], popular: true },
  { key: "pro", name: "Pro", features: ["Unlimited everything", "Dedicated manager", "0% commission"] },
];

const SubscriptionPanelSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    {/* Current Plan */}
    <Card>
      <CardContent className="p-6 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />

        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-36" />
        </div>
      </CardContent>
    </Card>

    {/* Plans */}
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>

            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export const SubscriptionPanel: React.FC = () => {
  const { data: subscription, isLoading } = useOrganizerSubscription();
  const switchToFree = useSwitchToFreePlan();
  const { authUser } = useAuth();

  const handleUpgrade = async (planKey: string) => {
    if (planKey === "on_demand") { switchToFree.mutate(); return; }
    try {
      const { data, error } = await supabase.functions.invoke("initiate-subscription-payment", {
        body: {
          email: authUser?.email, amount: PLAN_PRICES[planKey]?.monthly ?? 0, plan: planKey, billingCycle: "monthly",
          callbackUrl: `${window.location.origin}/dashboard?tab=subscription&payment=verify`,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.authorization_url) window.location.href = data.authorization_url;
    } catch (err: any) {
      toast.error(err.message || "Payment initialization failed");
    }
  };

 if (isLoading) {
  return <SubscriptionPanelSkeleton />;
}

  const currentPlan = subscription?.plan ?? "on_demand";

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 flex items-center gap-3">
          <Crown size={20} className="text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Current Plan</p>
            <p className="text-xl font-semibold capitalize">{currentPlan.replace("_", "-")}</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS.map((p) => {
          const isCurrent = p.key === currentPlan;
          return (
            <Card key={p.key} className={p.popular ? "ring-2 ring-primary" : ""}>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  {p.name}
                  {p.popular && <Badge>Popular</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={14} className="mt-0.5 text-primary shrink-0" /><span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={isCurrent ? "outline" : "default"} disabled={isCurrent} onClick={() => handleUpgrade(p.key)}>
                  {isCurrent ? "Current Plan" : "Choose Plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};