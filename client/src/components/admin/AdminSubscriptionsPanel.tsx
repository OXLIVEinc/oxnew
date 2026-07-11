import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface SubRow {
  id: string;
  organizerName: string;
  plan: string;
  status: string;
  billingCycle: string;
  periodStart: string;
  periodEnd: string;
  amount: number;
}

export function AdminSubscriptionsPanel() {
  const [subs, setSubs] = useState<SubRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubs = async () => {
    setLoading(true);
    const [subsRes, profilesRes] = await Promise.all([
      supabase.from('organizer_subscriptions').select('*'),
      supabase.from('profiles').select('user_id, display_name'),
    ]);

    const profileMap: Record<string, string> = {};
    profilesRes.data?.forEach((p: any) => { profileMap[p.user_id] = p.display_name || 'Unknown'; });

    setSubs(
      (subsRes.data || []).map((s: any) => ({
        id: s.id,
        organizerName: profileMap[s.user_id] || 'Unknown',
        plan: s.plan,
        status: s.status,
        billingCycle: s.billing_cycle,
        periodStart: s.current_period_start ? new Date(s.current_period_start).toLocaleDateString() : '—',
        periodEnd: s.current_period_end ? new Date(s.current_period_end).toLocaleDateString() : '—',
        amount: s.amount,
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchSubs(); }, []);

  const updateSub = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from('organizer_subscriptions').update({ [field]: value }).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Updated' }); fetchSubs(); }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[status] || '';
  };

  const filtered = subs.filter((s) => s.organizerName.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="text-muted-foreground">Loading subscriptions...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Input placeholder="Search by organizer name..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <span className="text-sm text-muted-foreground">{filtered.length} subscriptions</span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organizer</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Billing</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>Renewal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.organizerName}</TableCell>
                <TableCell>
                  <Select value={s.plan} onValueChange={(v) => updateSub(s.id, 'plan', v)}>
                    <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on_demand">On Demand</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="pro">Pro</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select value={s.status} onValueChange={(v) => updateSub(s.id, 'status', v)}>
                    <SelectTrigger className="w-[110px] h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="paused">Paused</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="capitalize">{s.billingCycle}</TableCell>
                <TableCell className="text-right">₦{s.amount.toLocaleString()}</TableCell>
                <TableCell>{s.periodStart}</TableCell>
                <TableCell>{s.periodEnd}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No subscriptions found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
