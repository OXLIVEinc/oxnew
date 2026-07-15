// client/src/lib/api/tickets.ts  (add checkInByCode)
import { api } from "./http";

export async function checkInTicket(token: string) {
  const { data } = await api.post<{ ticket: Record<string, unknown> }>("/tickets/check-in", { token });
  return data.ticket;
}

export async function checkInByCode(code: string) {
  const { data } = await api.post<{ ticket: Record<string, unknown> }>("/tickets/check-in-code", { code });
  return data.ticket;
}