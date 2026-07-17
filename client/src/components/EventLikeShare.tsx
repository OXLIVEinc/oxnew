import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CopyLinkDropdown } from "./CopyLinkDropdown";

interface EventLikeShareProps {
  eventId: string;
  eventTitle: string;
  eventCode: string;
  onAuthRequired?: () => void;
}

export const EventLikeShare: React.FC<EventLikeShareProps> = ({
  eventId,
  eventTitle,
  eventCode,
  onAuthRequired,
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

  const toggleLike = async () => {
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

  return (
    <div className="flex items-center gap-3">
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