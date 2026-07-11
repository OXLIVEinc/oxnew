import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface EventLikeShareProps {
  eventId: string;
  eventTitle: string;
  onAuthRequired?: () => void;
}

export const EventLikeShare: React.FC<EventLikeShareProps> = ({ eventId, eventTitle, onAuthRequired }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    fetchLikes();
  }, [eventId]);

  useEffect(() => {
    if (userId) checkIfLiked();
  }, [userId, eventId]);

  const fetchLikes = async () => {
    const { count } = await supabase
      .from('event_likes')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);
    setLikeCount(count || 0);
  };

  const checkIfLiked = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('event_likes')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .maybeSingle();
    setLiked(!!data);
  };

  const toggleLike = async () => {
    if (!userId) {
      onAuthRequired?.();
      return;
    }

    if (liked) {
      await supabase.from('event_likes').delete().eq('event_id', eventId).eq('user_id', userId);
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('event_likes').insert({ event_id: eventId, user_id: userId });
      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  const handleShare = async () => {
    const shareUrl = `https://ticketox.live/events/${eventId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: eventTitle, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={toggleLike}
        className="flex items-center gap-1.5 px-3 h-[34px] border border-[#1A1A1A] bg-white hover:bg-gray-50 transition-colors"
        aria-label={liked ? 'Unlike event' : 'Like event'}
      >
        <Heart className={`w-4 h-4 ${liked ? 'fill-[#FA76FF] text-[#FA76FF]' : 'text-[#1A1A1A]'}`} />
        <span className="text-[11px] uppercase font-medium">{likeCount}</span>
      </button>
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 px-3 h-[34px] border border-[#1A1A1A] bg-white hover:bg-gray-50 transition-colors"
        aria-label="Share event"
      >
        <Share2 className="w-4 h-4 text-[#1A1A1A]" />
        <span className="text-[11px] uppercase font-medium">Share</span>
      </button>
    </div>
  );
};
