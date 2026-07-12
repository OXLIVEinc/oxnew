
export interface SessionContext {
  eventId?: string;
  ticketTierId?: string;
  quantity?: number;

  orderId?: string;
  checkoutUrl?: string;
}

export interface Session {
  id: string;

  phoneNumber: string;

  status:
    | "idle"
    | "selected_event"
    | "selected_ticket_tier"
    | "selected_quantity"
    | "awaiting_payment";

  context: SessionContext;
}

// export interface Event {
//   id: string;

//   title: string;

//   banner?: string;

//   venue: string;

//   startsAt: string;

//   description?: string;
// }

export interface TicketTier {
  id: string;

  name: string;

  description?: string;

  price: number;
}

export interface OrderItem {
  name: string;

  email: string;

  phone: string;

  ticketTierId: string;

  ticketName: string;

  quantity: number;

  price: number;
}

export interface Order {
  id: string;

  eventId: string;

  reference: string;

  amount: number;

  status:
    | "awaiting_payment"
    | "paid"
    | "cancelled"
    | "expired";

  expiresAt: string;

  items: OrderItem[];
}

export interface ReviewState {

  loading: boolean;

  error?: string;

  mode: "cart" | "order";

  shouldResumeCheckout: boolean;

  checkoutUrl?: string;

  session?: Session;

  order?: Order;

  event?: Event;

  tier?: TicketTier;

  quantity: number;

}




import { z } from "zod";

export const attendeeSchema = z.object({

  name: z
    .string()
    .min(2, "Please enter a name"),

  email: z
    .string()
    .email("Invalid email"),

  phone: z
    .string()
    .min(10, "Invalid phone number"),

});

export const attendeeArraySchema = z.object({

  attendees: z.array(attendeeSchema),

});

export type AttendeeFormValues =
  z.infer<
    typeof attendeeArraySchema
  >;


  export interface OrganizerProfile {
  id: string;
  userId: string;
  brandName: string;
  bio: string | null;
  profilePhotoUrl: string | null;
  website: string | null;
  instagram: string | null;
  twitter: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Event {
  id: string;
  isFeatured: boolean;
  eventCode: string;
  title: string;
  description: string | null;
  createdBy: string;
  startsAt: Date;
  endsAt: Date | null;
  startTime: string;
  endTime: string | null;
  backgroundImageUrl: string;
  mobileBannerUrl: string | null;
  desktopBannerUrl: string | null;
  address: string;
  locationLat: string;
  locationLng: string;
  isPaid: boolean;
  ageGroup: string | null;
  genre: string | null;
  tags: string[] | null;
  maxPerOrder: number;
  status: string;
  approvalStatus: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  userId: string | null;
  email: string | null;
  displayName: string | null;
  phone: string | null;
  gender: string | null;
  locationCountry: string | null;
  createdAt: Date;
  updatedAt: Date;
}