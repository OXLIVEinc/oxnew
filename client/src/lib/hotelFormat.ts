/**
 * src/lib/hotelFormat.ts
 * -------------------------------------------------------------------------
 */
export function formatNaira(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  awaiting_payment: "Awaiting Payment",
  paid: "Paid — Awaiting Confirmation",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  declined: "Declined",
  expired: "Expired",
};

export const STATUS_BADGE_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  awaiting_payment: "outline",
  paid: "secondary",
  confirmed: "default",
  completed: "default",
  cancelled: "destructive",
  declined: "destructive",
  expired: "destructive",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
