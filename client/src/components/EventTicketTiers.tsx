import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

/**
 * src/components/EventTicketTiers.tsx
 * -------------------------------------------------------------------------
 * The ticket tier form used on Create/Edit Event. Every event needs at
 * least one tier — the parent page is responsible for seeding `tiers` with
 * a default "General Admission" tier before rendering this, and for
 * blocking submit if `tiers` is empty (the backend also enforces this).
 *
 * Rules encoded here (mirrors server/modules/ticket-tiers/ticket-tiers.service.ts):
 *   - Name: required.
 *   - Description: optional.
 *   - Price: only shown/required for paid events. Free events always sell at ₦0.
 *   - Quantity Type toggle: Limited (quantity required) <-> Unlimited (quantity disabled, never sells out).
 *   - Quantity: required + enabled only when Limited is selected.
 * -------------------------------------------------------------------------
 */
export interface TicketTierFormValue {
  id?: string;
  _tempId?: string;
  name: string;
  description: string;
  price: number;
  isUnlimited: boolean;
  quantity: number;
}

interface EventTicketTiersProps {
  tiers: TicketTierFormValue[];
  onChange: (tiers: TicketTierFormValue[]) => void;
  isPaid: boolean;
  onPaidChange: (isPaid: boolean) => void;
}

export function createDefaultTicketTier(): TicketTierFormValue {
  return {
    name: 'General Admission',
    description: '',
    price: 0,
    isUnlimited: false,
    quantity: 100,
    _tempId: crypto.randomUUID(),
  };
}

export const EventTicketTiers: React.FC<EventTicketTiersProps> = ({
  tiers,
  onChange,
  isPaid,
  onPaidChange,
}) => {
  const addTier = () => {
    onChange([...tiers, createDefaultTicketTier()]);
  };

  const updateTier = <K extends keyof TicketTierFormValue>(
    index: number,
    field: K,
    value: TicketTierFormValue[K]
  ) => {
    const updated = [...tiers];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const removeTier = (index: number) => {
    onChange(tiers.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start gap-5 self-stretch">
        <hr className="h-px self-stretch bg-foreground border-0" />
        <h3 className="text-foreground text-[11px] font-normal uppercase">TICKETING</h3>
      </div>

      {/* Paid/Free Toggle */}
      <div className="flex gap-0">
        <button
          type="button"
          onClick={() => onPaidChange(false)}
          className={`px-4 py-2.5 text-[13px] uppercase font-medium border border-foreground transition-colors ${
            !isPaid ? 'bg-foreground text-background' : 'bg-background text-foreground'
          }`}
        >
          Free Event
        </button>
        <button
          type="button"
          onClick={() => onPaidChange(true)}
          className={`px-4 py-2.5 text-[13px] uppercase font-medium border border-l-0 border-foreground transition-colors ${
            isPaid ? 'bg-foreground text-background' : 'bg-background text-foreground'
          }`}
        >
          Paid Event
        </button>
      </div>

      {/* Ticket Tiers */}
      {tiers.map((tier, index) => {
        const nameMissing = !tier.name.trim();
        const quantityMissing = !tier.isUnlimited && (!tier.quantity || tier.quantity <= 0);
        const key = tier.id || tier._tempId || `tier-${index}`;

        return (
          <div key={key} className="border border-foreground p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] uppercase font-medium text-foreground">
                Tier {index + 1}
              </span>
              {tiers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTier(index)}
                  className="text-destructive hover:text-destructive/80 transition-colors"
                  aria-label={`Remove tier ${index + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <input
                type="text"
                placeholder="Tier name (e.g., General Admission, VIP, Early Bird)"
                value={tier.name}
                onChange={(e) => updateTier(index, 'name', e.target.value)}
                className={`w-full px-3 py-2.5 text-[14px] border focus:outline-none placeholder:text-muted-foreground bg-background ${
                  nameMissing ? 'border-destructive' : 'border-foreground'
                }`}
              />
              {nameMissing && (
                <p className="text-[11px] text-destructive mt-1">Tier name is required.</p>
              )}
            </div>

            <input
              type="text"
              placeholder="Description (optional)"
              value={tier.description}
              onChange={(e) => updateTier(index, 'description', e.target.value)}
              className="w-full px-3 py-2.5 text-[14px] border border-foreground focus:outline-none placeholder:text-muted-foreground bg-background"
            />

            {isPaid && (
              <div>
                <label className="text-[11px] uppercase text-foreground mb-1 block">
                  Price (₦)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={tier.price || ''}
                  onChange={(e) => updateTier(index, 'price', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 text-[14px] border border-foreground focus:outline-none bg-background"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Leave blank for ₦0 (free entry via this tier).
                </p>
              </div>
            )}

            {/* Quantity Type: Limited <-> Unlimited toggle */}
            <div className="flex items-center justify-between border border-foreground px-3 py-2.5">
              <div>
                <Label htmlFor={`unlimited-${key}`} className="text-[13px] font-medium">
                  Unlimited quantity
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  {tier.isUnlimited
                    ? 'This tier can never sell out.'
                    : 'This tier sells out once the quantity below is reached.'}
                </p>
              </div>
              <Switch
                id={`unlimited-${key}`}
                checked={tier.isUnlimited}
                onCheckedChange={(checked) => updateTier(index, 'isUnlimited', checked)}
              />
            </div>

            <div>
              <label className="text-[11px] uppercase text-foreground mb-1 block">
                Quantity {tier.isUnlimited ? '(disabled — unlimited)' : ''}
              </label>
              <input
                type="number"
                min="1"
                disabled={tier.isUnlimited}
                value={tier.isUnlimited ? '' : tier.quantity || ''}
                onChange={(e) => updateTier(index, 'quantity', parseInt(e.target.value, 10) || 0)}
                placeholder={tier.isUnlimited ? 'Unlimited' : 'e.g. 100'}
                className={`w-full px-3 py-2.5 text-[14px] border focus:outline-none bg-background disabled:opacity-50 disabled:cursor-not-allowed ${
                  quantityMissing ? 'border-destructive' : 'border-foreground'
                }`}
              />
              {quantityMissing && (
                <p className="text-[11px] text-destructive mt-1">
                  Enter a quantity greater than 0, or switch to Unlimited.
                </p>
              )}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={addTier}
        className="flex items-center gap-2 px-4 py-2.5 text-[13px] uppercase font-medium border border-dashed border-foreground bg-background hover:bg-muted transition-colors w-full justify-center"
      >
        <Plus className="w-4 h-4" />
        Add Ticket Tier
      </button>
    </div>
  );
};

/**
 * Validates the tiers exactly like the backend does (see ticket-tiers.service.ts),
 * so the form can surface errors before submitting instead of round-tripping.
 * Returns an error message, or null if the tiers are valid.
 */
export function validateTicketTiers(tiers: TicketTierFormValue[], isPaid: boolean): string | null {
  if (tiers.length === 0) {
    return 'Every event needs at least one ticket tier.';
  }
  for (const tier of tiers) {
    if (!tier.name.trim()) return 'Every ticket tier needs a name.';
    if (!tier.isUnlimited && (!tier.quantity || tier.quantity <= 0)) {
      return `"${tier.name || 'Untitled tier'}" needs a quantity greater than 0, or switch it to Unlimited.`;
    }
  }
  if (isPaid && !tiers.some((t) => (t.price || 0) > 0)) {
    return 'Paid events need at least one ticket tier priced above ₦0.';
  }
  return null;
}
