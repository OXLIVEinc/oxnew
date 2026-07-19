// src/components/EventLikeShare.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CopyLinkDropdown } from "./CopyLinkDropdown";

type Variant = 'full' | 'like-only' | 'share-only' | 'like-only-compact';

interface EventLikeShareProps {
  eventId: string;
  eventTitle: string;
  eventCode: string;
  variant?: Variant;
  onAuthRequired?: () => void;
  className?: string;
}

export const EventLikeShare: React.FC<EventLikeShareProps> = ({
  eventId,
  eventTitle,
  eventCode,
  variant = 'full',
  onAuthRequired,
  className,
}) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    fetchLikes();
  }, [eventId]);

  useEffect(() => {
    if (user?.id) checkIfLiked();
  }, [user?.id, eventId]);

  const fetchLikes = async () => {
    const { count } = await supabase
      .from("event_likes")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    setLikeCount(count || 0);
  };

  const checkIfLiked = async () => {
    if (!user?.id) return;

    const { data } = await supabase
      .from("event_likes")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", user.id)
      .maybeSingle();

    setLiked(!!data);
  };

  const toggleLike = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent card click when clicking heart

    if (!user?.id) {
      onAuthRequired?.();
      return;
    }

    if (liked) {
      await supabase
        .from("event_likes")
        .delete()
        .eq("event_id", eventId)
        .eq("user_id", user.id);

      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      await supabase
        .from("event_likes")
        .insert({ event_id: eventId, user_id: user.id });

      setLiked(true);
      setLikeCount((c) => c + 1);
    }
  };

  if (variant === 'like-only-compact') {
    return (
      <button
        onClick={toggleLike}
        className={`h-8 w-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center transition-all active:scale-95 ${className || ''}`}
        aria-label={liked ? "Unlike event" : "Like event"}
      >
        <Heart
          className={`w-4 h-4 transition-colors ${
            liked ? "fill-[#FA76FF] text-[#FA76FF]" : "text-white"
          }`}
        />
      </button>
    );
  }

  if (variant === 'like-only') {
    return (
      <button
        onClick={toggleLike}
        className="flex items-center gap-1.5 px-3 h-[34px] border border-[#1A1A1A] bg-white hover:bg-gray-50 transition-colors"
        aria-label={liked ? "Unlike event" : "Like event"}
      >
        <Heart
          className={`w-4 h-4 ${
            liked ? "fill-[#FA76FF] text-[#FA76FF]" : "text-[#1A1A1A]"
          }`}
        />
        <span className="text-[11px] uppercase font-medium">
          {likeCount}
        </span>
      </button>
    );
  }

  if (variant === 'share-only') {
    return (
      <CopyLinkDropdown
        eventId={eventId}
        eventTitle={eventTitle}
        eventCode={eventCode}
      />
    );
  }

  // Default: full (like + share)
  return (
    <div className={`flex items-center gap-3 ${className || ''}`}>
      <button
        onClick={toggleLike}
        className="flex items-center gap-1.5 px-3 h-[34px] border border-[#1A1A1A] bg-white hover:bg-gray-50 transition-colors"
        aria-label={liked ? "Unlike event" : "Like event"}
      >
        <Heart
          className={`w-4 h-4 ${
            liked ? "fill-[#FA76FF] text-[#FA76FF]" : "text-[#1A1A1A]"
          }`}
        />
        <span className="text-[11px] uppercase font-medium">
          {likeCount}
        </span>
      </button>

      <CopyLinkDropdown
        eventId={eventId}
        eventTitle={eventTitle}
        eventCode={eventCode}
      />
    </div>
  );
};