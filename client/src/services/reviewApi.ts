import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

export const getSession = async (sessionId: string) => {
  const { data } = await api.get(`/session/${sessionId}`);
  return data;
};

export const updateSession = async (sessionId: string, body: any) => {
  const { data } = await api.patch(`/session/${sessionId}`, body);
  return data;
};

export const getOrder = async (orderId: string) => {
  const { data } = await api.get(`/order/${orderId}`);
  return data;
};

export const getEvent = async (eventId: string) => {
  const { data } = await api.get(`/events/${eventId}`);
  return data;
};

export const getTicketTier = async (tierId: string) => {
  const { data } = await api.get(`/ticket-tier/${tierId}`);
  return data;
};

export const initializePayment = async (body: any) => {
  const { data } = await api.post("/payments/initialize", body);
  return data;
};