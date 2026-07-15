// client/src/lib/api/organizer.ts
import { api } from "./http";

export interface OrganizerOverview {
  totalEvents: number;
  activeEvents: number;
  totalGuests: number;
  ticketsSold: number;
  totalRevenue: number;
}

export interface OrganizerEventSummary {
  id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  backgroundImageUrl: string;
  targetDate: string;
  guestCount: number;
}

export interface EventAnalytics {
  totalGuests: number;
  checkedIn: number;
  revenue: number;
  genderCounts: Record<string, number>;
  locationCounts: Record<string, number>;
  registrationsOverTime: { date: string; count: number }[];
  tierBreakdown: { name: string; sold: number; revenue: number }[];
}

export interface OrganizerProfileData {
  id: string;
  userId: string;
  brandName: string;
  bio: string | null;
  profilePhotoUrl: string | null;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
}

export interface OrganizerSubscription {
  id?: string;
  plan: string;
  status: string;
  billingCycle: string;
  currentPeriodEnd?: string | null;
}

export interface CampaignRecord {
  id: string;
  subject: string;
  message: string;
  type: string;
  status: string;
  sentAt: string | null;
  recipientCount: number;
  createdAt: string;
}

export interface GuestRecord {
  userId: string;
  registeredAt: string | null;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  gender: string | null;
  locationCountry: string | null;
  checkedIn: boolean;
  tierName: string | null;
  checkInCode: string | null;
  ticketId: string | null;
}

export async function fetchOrganizerOverview() {
  const { data } = await api.get<{ overview: OrganizerOverview }>("/organizer/dashboard/overview");
  return data.overview;
}

export async function fetchOrganizerEvents() {
  const { data } = await api.get<{ events: OrganizerEventSummary[] }>("/organizer/dashboard/events");
  return data.events;
}

export async function fetchEventAnalytics(eventId: string, params?: { dateFrom?: string; dateTo?: string }) {
  const { data } = await api.get<EventAnalytics>(`/organizer/dashboard/analytics/${eventId}`, { params });
  return data;
}

export async function fetchOrganizerProfile() {
  const { data } = await api.get<{ profile: OrganizerProfileData | null }>("/organizer/profile");
  return data.profile;
}

export async function updateOrganizerProfile(patch: Partial<OrganizerProfileData>) {
  const { data } = await api.patch<{ profile: OrganizerProfileData }>("/organizer/profile", patch);
  return data.profile;
}

export async function fetchOrganizerSubscription() {
  const { data } = await api.get<{ subscription: OrganizerSubscription }>("/organizer/subscription");
  return data.subscription;
}

export async function switchToFreePlan() {
  const { data } = await api.post<{ subscription: OrganizerSubscription }>("/organizer/subscription/switch-free");
  return data.subscription;
}

export async function fetchCampaigns(eventId: string) {
  const { data } = await api.get<{ campaigns: CampaignRecord[] }>(`/organizer/campaigns/${eventId}`);
  return data.campaigns;
}

export async function createCampaign(eventId: string, input: { subject: string; message: string; type: "email" | "sms" }) {
  const { data } = await api.post<{ campaign: CampaignRecord }>(`/organizer/campaigns/${eventId}`, input);
  return data.campaign;
}

export async function fetchGuests(eventId: string, params?: { dateFrom?: string; dateTo?: string }) {
  const { data } = await api.get<{ guests: GuestRecord[] }>(`/organizer/guests/${eventId}`, { params });
  return data.guests;
}

export async function removeGuest(eventId: string, userId: string) {
  await api.delete(`/organizer/guests/${eventId}/${userId}`);
}