import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Send } from 'lucide-react';

interface NotificationLog {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  userName: string;
}

export function AdminBroadcastPanel() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<'organizers' | 'guests' | 'all'>('all');
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLogs = async () => {
      const [notifRes, profilesRes] = await Promise.all([
        supabase.from('notifications').select('id, title, message, type, created_at, user_id').order('created_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('user_id, display_name'),
      ]);
      const profileMap: Record<string, string> = {};
      profilesRes.data?.forEach((p: any) => { profileMap[p.user_id] = p.display_name || 'Unknown'; });

      setLogs((notifRes.data || []).map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        createdAt: new Date(n.created_at).toLocaleString(),
        userName: profileMap[n.user_id] || 'Unknown',
      })));
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const sendBroadcast = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'Missing fields', description: 'Subject and message are required', variant: 'destructive' });
      return;
    }
    setSending(true);

    // Get target users based on audience
    let userIds: string[] = [];
    if (audience === 'organizers' || audience === 'all') {
      const { data } = await supabase.from('user_roles').select('user_id').eq('role', 'organizer');
      data?.forEach((r: any) => userIds.push(r.user_id));
    }
    if (audience === 'guests' || audience === 'all') {
      const { data } = await supabase.from('user_roles').select('user_id').eq('role', 'guest');
      data?.forEach((r: any) => { if (!userIds.includes(r.user_id)) userIds.push(r.user_id); });
    }

    if (userIds.length === 0) {
      toast({ title: 'No recipients', description: 'No users found for this audience', variant: 'destructive' });
      setSending(false);
      return;
    }

    // Insert notifications for all users
    const notifications = userIds.map((uid) => ({
      user_id: uid,
      title: subject,
      message: message,
      type: 'broadcast',
    }));

    // Batch insert (Supabase allows bulk inserts)
    const { error } = await supabase.from('notifications').insert(notifications);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Broadcast sent', description: `Notification sent to ${userIds.length} users` });
      setSubject('');
      setMessage('');
      // Refresh logs
      const { data: newLogs } = await supabase.from('notifications').select('id, title, message, type, created_at, user_id').order('created_at', { ascending: false }).limit(50);
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name');
      const pm: Record<string, string> = {};
      profiles?.forEach((p: any) => { pm[p.user_id] = p.display_name || 'Unknown'; });
      setLogs((newLogs || []).map((n: any) => ({
        id: n.id, title: n.title, message: n.message, type: n.type,
        createdAt: new Date(n.created_at).toLocaleString(),
        userName: pm[n.user_id] || 'Unknown',
      })));
    }
    setSending(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Compose Broadcast</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Audience</label>
              <Select value={audience} onValueChange={(v: any) => setAudience(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="organizers">Organizers Only</SelectItem>
                  <SelectItem value="guests">Guests Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Subject</label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Notification title..." />
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Message</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your broadcast message..." rows={4} />
          </div>
          <Button onClick={sendBroadcast} disabled={sending}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? 'Sending...' : 'Send Broadcast'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Notifications Log</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium text-sm">{l.title}</TableCell>
                      <TableCell className="text-sm">{l.userName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{l.type}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{l.createdAt}</TableCell>
                    </TableRow>
                  ))}
                  {logs.length === 0 && (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No notifications yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
