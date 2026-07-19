/**
 * src/lib/api/hotelTypes.ts
 * -------------------------------------------------------------------------
 * Types for the Hotel Partner Dashboard API. Mirrors the shapes returned by
 * server/modules/hotel/**.
 * -------------------------------------------------------------------------
 */
export type BookingTab =
  | "pending"
  | "paid_awaiting_confirmation"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "declined"
  | "expired";

export type BookingAction = "confirm" | "decline" | "check_in" | "complete";

export interface HotelBooking {
  id: string;
  hotelId: string;
  userId: string | null;
  reference: string;
  status: string;
  guestName: string | null;
  guestPhone: string;
  guestEmail: string | null;
  roomTypeId: string;
  roomTypeName: string;
  guests: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  pricePerNight: string;
  subtotal: string;
  serviceFee: string;
  amount: string;
  currency: string;
  paymentProvider: string | null;
  paystackReference: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  cancelledAt: string | null;
  declinedAt: string | null;
  expiresAt: string | null;
  checkedIn: boolean;
  validActions: BookingAction[];
}

export interface HotelBookingDetail extends HotelBooking {
  specialRequests: string | null;
  timeline: { label: string; at: string }[];
}

export interface BookingListResult {
  bookings: HotelBooking[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface BookingListParams {
  tab?: BookingTab;
  status?: string;
  roomTypeId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "checkIn" | "checkOut" | "amount";
  sortDir?: "asc" | "desc";
}

export interface DashboardOverview {
  pendingConfirmations: number;
  todaysCheckIns: number;
  todaysCheckOuts: number;
  confirmedBookings: number;
  completedBookings: number;
  totalBookings: number;
  revenueToday: number;
  revenueThisMonth: number;
}

export interface DashboardActivity {
  recentBookings: HotelBooking[];
  upcomingArrivals: HotelBooking[];
}

export interface BookingStatusPoint {
  status: string;
  count: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface HotelRoomType {
  id: string;
  hotelId: string;
  name: string;
  description: string | null;
  pricePerNight: string;
  capacity: number;
  quantity: number;
  sortOrder: number;
  createdAt: string;
  occupied: number;
  available: number;
  upcomingBookings: number;
  occupancyRate: number;
}

export interface RoomTypeInput {
  name: string;
  description?: string | null;
  pricePerNight: number;
  capacity?: number;
  quantity?: number;
}

export interface HotelBankAccountDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface HotelProfile {
  id: string;
  userId: string | null;
  name: string;
  state?: string;
country?: string;
city?: string;
  address: string;
  locationLat: string;
  locationLng: string;
  whatsappNumber: string;
  commissionRate: string;
  bankAccountDetails: HotelBankAccountDetails | null;
  approvalStatus: string;
  createdAt: string;
  logoUrl: string | null;
  coverImageUrl: string | null;
  description: string | null;
  amenities: string[] | null;
  updatedAt: string;
}

export interface HotelProfileInput {
  name?: string;
  description?: string | null;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  address?: string;
  whatsappNumber?: string;
  amenities?: string[];
  bankAccountDetails?: HotelBankAccountDetails | null;
  locationLat?: number;
  locationLng?: number;
  state: string;
country: string;
city: string;
}

export interface AnalyticsMonthPoint {
  month: string;
  revenue: number;
  bookings: number;
}

export interface AnalyticsSummary {
  revenueByMonth: AnalyticsMonthPoint[];
  bookingsByMonth: { month: string; bookings: number }[];
  occupancy: { occupancyRate: number; occupiedRooms: number; totalRooms: number };
  averageStayLength: number;
  mostBookedRoomType: { roomTypeName: string; count: number } | null;
  statusDistribution: BookingStatusPoint[];
}

export interface PayoutRecord {
  id: string;
  userId: string;
  eventId: string | null;
  amount: string;
  type: string;
  status: string;
  paystackTransferRef: string | null;
  scheduledFor: string | null;
  createdAt: string;
}

export interface PayoutSummary {
  commissionRate: string;
  grossEarnings: number;
  platformCommission: number;
  netEarnings: number;
  pendingPayout: number;
  paidOut: number;
  history: PayoutRecord[];
}

export interface HotelNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  eventId: string | null;
  createdAt: string;
}

export interface NotificationsResult {
  notifications: HotelNotification[];
  unreadCount: number;
  total: number;
  page: number;
  pageSize: number;
}
