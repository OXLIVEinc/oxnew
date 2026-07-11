import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Ban, ChevronDown, ChevronUp } from 'lucide-react';

interface OrganizerRow {
  userId: string;
  displayName: string;
  phone: string;
  plan: string;
  eventsCount: number;
  dateJoined: string;
  subscriptionId: string | null;
  hasOrgProfile: boolean;
}

interface OrgEvent {
  id: string;
  title: string;
  date: string;
  status: string;
}

export function AdminOrganizersPanel() {
  const [organizers, setOrganizers] = useState<OrganizerRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [orgEvents, setOrgEvents] = useState<OrgEvent[]>([]);
  const { toast } = useToast();

  const fetchOrganizers = async () => {
    setLoading(true);
    const [rolesRes, profilesRes, subsRes, eventsRes, orgProfilesRes] = await Promise.all([
      supabase.from('user_roles').select('user_id, created_at').eq('role', 'organizer'),
      supabase.from('profiles').select('user_id, display_name, phone'),
      supabase.from('organizer_subscriptions').select('id, user_id, plan'),
      supabase.from('events').select('created_by'),
      supabase.from('organizer_profiles').select('user_id'),
    ]);

    const profileMap: Record<string, { name: string; phone: string }> = {};
    profilesRes.data?.forEach((p: any) => { profileMap[p.user_id] = { name: p.display_name || 'Unknown', phone: p.phone || '—' }; });

    const subMap: Record<string, { plan: string; id: string }> = {};
    subsRes.data?.forEach((s: any) => { subMap[s.user_id] = { plan: s.plan, id: s.id }; });

    const eventCountMap: Record<string, number> = {};
    eventsRes.data?.forEach((e: any) => { eventCountMap[e.created_by] = (eventCountMap[e.created_by] || 0) + 1; });

    const orgProfileSet = new Set<string>();
    orgProfilesRes.data?.forEach((o: any) => orgProfileSet.add(o.user_id));

    setOrganizers(
      (rolesRes.data || []).map((r: any) => ({
        userId: r.user_id,
        displayName: profileMap[r.user_id]?.name || 'Unknown',
        phone: profileMap[r.user_id]?.phone || '—',
        plan: subMap[r.user_id]?.plan || 'none',
        subscriptionId: subMap[r.user_id]?.id || null,
        eventsCount: eventCountMap[r.user_id] || 0,
        dateJoined: new Date(r.created_at).toLocaleDateString(),
        hasOrgProfile: orgProfileSet.has(r.user_id),
      }))
    );
    setLoading(false);
  };

  useEffect(() => { fetchOrganizers(); }, []);

  const changePlan = async (subId: string | null, userId: string, plan: string) => {
    if (!subId) {
      toast({ title: 'No subscription', description: 'This organizer has no subscription record', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('organizer_subscriptions').update({ plan }).eq('id', subId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Plan updated' }); fetchOrganizers(); }
  };

  const suspendOrganizer = async (userId: string) => {
    if (!confirm('Suspend this organizer? This removes their organizer role.')) return;
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'organizer');
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Organizer suspended' }); fetchOrganizers(); }
  };

  const toggleExpand = async (userId: string) => {
    if (expandedOrg === userId) {
      setExpandedOrg(null);
      return;
    }
    const { data } = await supabase.from('events').select('id, title, date, status').eq('created_by', userId).order('target_date', { ascending: false });
    setOrgEvents(data || []);
    setExpandedOrg(userId);
  };

  const filtered = organizers.filter((o) =>
    o.displayName.toLowerCase().includes(search.toLowerCase()) || o.phone.includes(search)
  );

  const planBadge = (plan: string) => {
    const colors: Record<string, string> = {
      on_demand: 'bg-muted text-muted-foreground',
      starter: 'bg-blue-500/20 text-blue-400',
      pro: 'bg-purple-500/20 text-purple-400',
      enterprise: 'bg-yellow-500/20 text-yellow-400',
      none: 'bg-muted text-muted-foreground',
    };
    return <Badge variant="outline" className={colors[plan] || ''}>{plan.replace('_', ' ')}</Badge>;
  };

  if (loading) return <div className="text-muted-foreground">Loading organizers...</div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Input placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <span className="text-sm text-muted-foreground">{filtered.length} organizers</span>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Profile</TableHead>
              <TableHead className="text-right">Events</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((o) => (
              <>
                <TableRow key={o.userId}>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpand(o.userId)}>
                      {expandedOrg === o.userId ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{o.displayName}</TableCell>
                  <TableCell className="text-sm">{o.phone}</TableCell>
                  <TableCell>
                    <Select value={o.plan} onValueChange={(v) => changePlan(o.subscriptionId, o.userId, v)}>
                      <SelectTrigger className="w-[140px] h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_demand">On Demand</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={o.hasOrgProfile ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}>
                      {o.hasOrgProfile ? 'Verified' : 'No Profile'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{o.eventsCount}</TableCell>
                  <TableCell>{o.dateJoined}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => suspendOrganizer(o.userId)} title="Suspend">
                      <Ban className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedOrg === o.userId && (
                  <TableRow key={`${o.userId}-events`}>
                    <TableCell colSpan={8} className="bg-muted/30 p-4">
                      <div className="text-sm font-medium mb-2">Events by {o.displayName}</div>
                      {orgEvents.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No events</p>
                      ) : (
                        <div className="grid gap-2">
                          {orgEvents.map((ev) => (
                            <div key={ev.id} className="flex items-center justify-between text-sm py-1 border-b border-border last:border-0">
                              <span>{ev.title}</span>
                              <div className="flex gap-3 items-center">
                                <span className="text-muted-foreground">{ev.date}</span>
                                <Badge variant="outline" className="text-xs">{ev.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No organizers found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
