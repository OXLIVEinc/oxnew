import { useState } from "react";
import {
  Copy,
  Check,
  Share2,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CopyLinkDropdownProps {
  eventId: string;
  eventTitle: string;
  eventCode: string;
}

export function CopyLinkDropdown({
  eventId,
  eventTitle,
  eventCode,
}: CopyLinkDropdownProps) {
  const [copied, setCopied] = useState<"link" | "wa" | null>(null);

  const eventLink = `${window.location.origin}/event/${eventId}`;

  const whatsappNumber = import.meta.env.VITE_OX_WHATSAPP_NUMBER;

  // Opens a chat with your OX WhatsApp number and pre-fills only the event code.
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    eventCode
  )}`;

  const copy = async (text: string, type: "link" | "wa") => {
    try {
      await navigator.clipboard.writeText(text);

      setCopied(type);

      toast.success(
        type === "link"
          ? "Event link copied"
          : "WhatsApp link copied"
      );

      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 h-[34px] rounded-none border border-[#1A1A1A]"
        >
          <Share2 className="h-3 w-3" />
          Share
          <ChevronDown className="h-4 w-4 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem onClick={() => copy(eventLink, "link")}>
          {copied === "link" ? (
            <Check className="mr-2 h-4 w-4 text-green-600" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy Event Link
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => copy(whatsappLink, "wa")}>
          {copied === "wa" ? (
            <Check className="mr-2 h-4 w-4 text-green-600" />
          ) : (
            <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
          )}
          Copy WhatsApp Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}