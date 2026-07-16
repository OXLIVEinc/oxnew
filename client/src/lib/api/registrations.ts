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
  const { data } = await api.post<{ order: CreatedOrder }>("/registrations/order", input);
  return data.order;
}