import { api } from "./http";
import type { RegisterInput, RegisterResult } from "./types";

export async function registerForEvent(input: RegisterInput) {
  const { data } = await api.post<RegisterResult>("/registrations", input);
  return data;
}

export interface OrderSelection {
  tierId: string;
}

export interface CreateOrderInput {
  eventId: string;
  selections: OrderSelection[];
}

export interface CreateGuestOrderInput {
  eventId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  selections: OrderSelection[];
}

export interface CreatedOrder {
  id: string;
  reference: string;
  eventId: string;
  quantity: number;
  amount: string;
  status: string;
  expiresAt: string | null;
}

export async function createEventOrder(input: CreateOrderInput) {
  const { data } = await api.post<{ order: CreatedOrder }>(
    "/registrations/order",
    input
  );

  return data.order;
}

export async function createGuestEventOrder(
  input: CreateGuestOrderInput
) {
  const { data } = await api.post<{ order: CreatedOrder }>(
    "/registrations/guest-order",
    input
  );

  return data.order;
}