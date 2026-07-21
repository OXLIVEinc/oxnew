import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Star, 
  StarOff, 
  CheckCircle, 
  XCircle, 
  Clock,
  Eye
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface EventRow {
  id: string;
  title: string;
  creatorName: string;
  createdBy: string;
  startsAt: string;
  address: string;
  status: string;
  approvalStatus: string;
  ticketsSold: number;
  revenue: number;
  isFeatured: boolean;
}

interface ApprovalModalProps {
  event: EventRow | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (eventId: string, reason?: string) => void;
  onReject: (eventId: string, reason: string) => void;
}

function ApprovalModal({ event, isOpen, onClose, onApprove, onReject }: ApprovalModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    if (!event) return;
    setIsSubmitting(true);
    try {
      await onApprove(event.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!event) return;
    if (!reason.trim()) {
      toast({ 
        title: 'Reason required', 
        description: 'Please provide a reason for rejecting this event.',
        variant: 'destructive' 
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await onReject(event.id, reason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Review Event: {event.title}</DialogTitle>
          <DialogDescription>
            Review the event details before making a decision.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Organizer</span>
              <span className="text-sm">{event.creatorName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Date</span>
              <span className="text-sm">{event.startsAt}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Venue</span>
              <span className="text-sm">{event.address}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Tickets Sold</span>
              <span className="text-sm">{event.ticketsSold}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Revenue</span>
              <span className="text-sm">₦{event.revenue.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason (required for rejection)</Label>
            <Textarea
              id="reason"
              placeholder="Why is this event being rejected?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleReject}
            disabled={isSubmitting || !reason.trim()}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button 
            variant="default" 
            onClick={handleApprove}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdminEventsPanel() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchEvents = async () => {
    setLoading(true);
    
    try {
      // First, fetch all events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*');

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        setLoading(false);
        return;
      }

      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      // Get all unique creator IDs
      const creatorIds = [...new Set(eventsData.map(e => e.created_by).filter(Boolean))];
      
      // Fetch profiles for all creators
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .in('id', creatorIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Create a map of user ID to profile info
      const profileMap: Record<string, { display_name: string | null, email: string | null }> = {};
      profilesData?.forEach((profile: any) => {
        profileMap[profile.id] = {
          display_name: profile.display_name,
          email: profile.email
        };
      });

      // Get event IDs for ticket queries
      const eventIds = eventsData.map(e => e.id);

      // Fetch tickets with tier info
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          event_id,
          ticket_tier_id,
          ticket_tiers!inner (
            price
          )
        `)
        .in('event_id', eventIds);

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
      }

      // Calculate ticket counts and revenue per event
      const ticketCountMap: Record<string, number> = {};
      const revenueMap: Record<string, number> = {};

      ticketsData?.forEach((t: any) => {
        ticketCountMap[t.event_id] = (ticketCountMap[t.event_id] || 0) + 1;
        if (t.ticket_tiers?.price) {
          const price = Number(t.ticket_tiers.price);
          revenueMap[t.event_id] = (revenueMap[t.event_id] || 0) + price;
        }
      });

      // Map events to the expected format
      const formattedEvents = eventsData.map((e: any) => {
        const profile = profileMap[e.created_by] || { display_name: null, email: null };
        return {
          id: e.id,
          title: e.title,
          creatorName: profile.display_name || profile.email || 'Unknown Organizer',
          createdBy: e.created_by,
          startsAt: new Date(e.starts_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          }),
          address: e.address,
          status: e.status || 'active',
          approvalStatus: e.approval_status || 'pending',
          ticketsSold: ticketCountMap[e.id] || 0,
          revenue: revenueMap[e.id] || 0,
          isFeatured: e.is_featured || false,
        };
      });

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
      toast({ 
        title: 'Error', 
        description: 'Failed to load events. Please try again.', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from('events')
      .update({ status })
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Status updated' });
      fetchEvents();
    }
  };

  const handleApprove = async (eventId: string, reason?: string) => {
    const { error } = await supabase
      .from('events')
      .update({ 
        approval_status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    // Create approval record
    const { error: approvalError } = await supabase
      .from('event_approvals')
      .insert({
        event_id: eventId,
        status: 'approved',
        reason: reason || null,
        reviewed_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (approvalError) {
      console.error('Error creating approval record:', approvalError);
    }

    toast({ title: 'Event approved successfully' });
    fetchEvents();
  };

  const handleReject = async (eventId: string, reason: string) => {
    const { error } = await supabase
      .from('events')
      .update({ 
        approval_status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    // Create approval record
    const { error: approvalError } = await supabase
      .from('event_approvals')
      .insert({
        event_id: eventId,
        status: 'rejected',
        reason: reason,
        reviewed_by: (await supabase.auth.getUser()).data.user?.id
      });

    if (approvalError) {
      console.error('Error creating approval record:', approvalError);
    }

    toast({ title: 'Event rejected' });
    fetchEvents();
  };

  const openApprovalModal = (event: EventRow) => {
    setSelectedEvent(event);
    setIsApprovalModalOpen(true);
  };

  const toggleFeatured = async (id: string, currentFeatured: boolean) => {
    const { error } = await supabase
      .from('events')
      .update({ is_featured: !currentFeatured })
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: currentFeatured ? 'Unfeatured' : 'Featured' });
      fetchEvents();
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event permanently? This will also remove all associated tickets and registrations.')) return;
    
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Event deleted' });
      fetchEvents();
    }
  };

  const getApprovalBadge = (status: string) => {
    const config = {
      pending: { 
        label: 'Pending Review', 
        className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      approved: { 
        label: 'Approved', 
        className: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      rejected: { 
        label: 'Rejected', 
        className: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: <XCircle className="h-3 w-3 mr-1" />
      }
    };

    const cfg = config[status as keyof typeof config] || config.pending;
    return (
      <Badge variant="outline" className={cfg.className}>
        {cfg.icon}
        {cfg.label}
      </Badge>
    );
  };

  const filtered = events.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.creatorName.toLowerCase().includes(search.toLowerCase()) ||
      e.address.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchesApproval = approvalFilter === 'all' || e.approvalStatus === approvalFilter;
    return matchesSearch && matchesStatus && matchesApproval;
  });

  if (loading) return <div className="text-muted-foreground">Loading events...</div>;

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <Input 
            placeholder="Search by title, organizer, or venue..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="max-w-sm" 
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={approvalFilter} onValueChange={setApprovalFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Approval Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Approvals</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">{filtered.length} events</span>
        </div>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Organizer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Approval</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Tickets</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e) => (
                <TableRow 
                  key={e.id} 
                  className="cursor-pointer hover:bg-muted/50" 
                  onClick={() => navigate(`/event/${e.id}`)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {e.isFeatured && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
                      {e.title}
                    </div>
                  </TableCell>
                  <TableCell>{e.creatorName}</TableCell>
                  <TableCell className="whitespace-nowrap">{e.startsAt}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{e.address}</TableCell>
                  <TableCell onClick={(ev) => ev.stopPropagation()}>
                    {getApprovalBadge(e.approvalStatus)}
                  </TableCell>
                  <TableCell onClick={(ev) => ev.stopPropagation()}>
                    <Select value={e.status} onValueChange={(v) => updateStatus(e.id, v)}>
                      <SelectTrigger className="w-[120px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">{e.ticketsSold}</TableCell>
                  <TableCell className="text-right">₦{e.revenue.toLocaleString()}</TableCell>
                  <TableCell onClick={(ev) => ev.stopPropagation()}>
                    <div className="flex gap-1">
                      {e.approvalStatus === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => openApprovalModal(e)} 
                          title="Review Event"
                          className="h-8 w-8"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => toggleFeatured(e.id, e.isFeatured)} 
                        title={e.isFeatured ? 'Unfeature' : 'Feature'}
                        className="h-8 w-8"
                      >
                        {e.isFeatured ? 
                          <StarOff className="h-4 w-4 text-yellow-400" /> : 
                          <Star className="h-4 w-4 text-muted-foreground" />
                        }
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteEvent(e.id)} 
                        title="Delete"
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No events found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ApprovalModal
        event={selectedEvent}
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setSelectedEvent(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}