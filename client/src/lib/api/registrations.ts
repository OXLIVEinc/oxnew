/**
 * src/lib/api/registrations.ts
 * -------------------------------------------------------------------------
 */
import { api } from "./http";
import type { RegisterInput, RegisterResult } from "./types";

export async function registerForEvent(input: RegisterInput) {
  const { data } = await api.post<RegisterResult>("/registrations", input);
  return data;
}
