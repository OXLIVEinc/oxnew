import axios from 'axios';

export const api = axios.create({
  baseURL: `${(import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "")}/api/w`,
});

function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong.';
}

// ---------------------------------------------------------------------------
// Ticket checkout — GET the order + event, then submit attendee items to
// initialize payment (or, for a free event, to register directly).
// ---------------------------------------------------------------------------

export interface TicketOrder {
  id: string;
  reference: string;
  eventId: string;
  tierId: string;
  quantity: number;
  unitPrice: string;
  amount: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  subtotal:string;
}

export interface EventInfo {
  id: string;
  title: string;
  address: string;
  startsAt: string;
  endsAt: string;
  backgroundImageUrl: string | null;
}

export interface AttendeeItem {
  attendeeName: string;
  attendeeEmail: string;
}

export async function fetchCheckout(orderId: string): Promise<{ order: TicketOrder; event: EventInfo }> {
  try {
    const { data } = await api.get(`/checkout/${orderId}`);
    return data;
  } catch (err) {
    throw new Error(errorMessage(err));
  }
}

export async function submitCheckout(
  orderId: string,
  items: AttendeeItem[]
): Promise<{ ok: true; free: boolean; authorizationUrl: string | null; reference: string }> {
  try {
    const { data } = await api.post(`/checkout/${orderId}/submit`, { items });
    console.log(data)
    return data;
  } catch (err) {
    throw new Error(errorMessage(err));
  }
}

// ---------------------------------------------------------------------------
// Hotel order review — order already exists with no payment initialized.
// GET the summary, then either pay (Paystack) or, if free, register
// directly with the same endpoint.
// ---------------------------------------------------------------------------

export interface HotelOrder {
  id: string;
  reference: string;
  hotelId: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNight: string;
  amount: string;
  status: string;
  expiresAt: string | null;
  createdAt: string;
  subTotal:string;
}

export async function fetchHotelOrder(orderId: string): Promise<{ order: HotelOrder; hotelName: string; hotelAddress: string }> {
  try {
    const { data } = await api.get(`/hotel-order/${orderId}`);
    return data;
  } catch (err) {
    throw new Error(errorMessage(err));
  }
}

export async function payHotelOrder(
  orderId: string,
  email?: string
): Promise<{ ok: true; free: boolean; authorizationUrl?: string; status?: string }> {
  try {
    const { data } = await api.post(`/hotel-order/${orderId}/pay`, { email });
    return data;
  } catch (err) {
    throw new Error(errorMessage(err));
  }
}

// ---------------------------------------------------------------------------
// Ticket transfer claim — recipient reviews the ticket being sent to them,
// then claims (name + email) or declines it.
// ---------------------------------------------------------------------------

export interface TransferInfo {
  transferCode: string;
  recipientPhone: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface TicketInfo {
  id: string;
  status: string;
  eventId: string;
  tierId: string;
  orderId: string | null;
  eventName: string;
  tierLabel: string;
}

export async function fetchTransferClaim(code: string): Promise<{ transfer: TransferInfo; ticket: TicketInfo }> {
  try {
    const { data } = await api.get(`/transfer/claim/${code}`);
    return data;
  } catch (err) {
    throw new Error(errorMessage(err));
  }
}

export async function confirmTransferClaim(code: string, fullName: string, email: string): Promise<{ ok: true }> {
  try {
    const { data } = await api.post(`/transfer/claim/${code}/confirm`, { fullName, email });
    return data;
  } catch (err) {
    throw new Error(errorMessage(err));
  }
}

export async function declineTransferClaim(code: string): Promise<{ ok: true }> {
  try {
    const { data } = await api.post(`/transfer/claim/${code}/decline`);
    return data;
  } catch (err) {
    throw new Error(errorMessage(err));
  }
}
