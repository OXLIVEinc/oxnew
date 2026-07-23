import {
  pgTable, text, uuid, timestamp, index, integer, boolean, numeric, jsonb, uniqueIndex, pgEnum
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export type OrderItem = {
  attendeeName: string;
  attendeeEmail: string;
  tierId?: string;
  unitPrice?: number;
};

import { createInsertSchema } from "drizzle-zod";


export const appRole = pgEnum("app_role", [
  'admin',
  'user',
  'organizer',
  'guest',
  'hotel_partner'
]);

export const orderSourceEnum = pgEnum("order_source", ["web", "whatsapp"]);


// ==================== ENUMS ====================

export const ticketStatusEnum = pgEnum("ticket_status", [
  "valid",
  "transferred",
  "used",
]);

export const ticketOrderStatusEnum = pgEnum("ticket_order_status", [
  "pending",           // created, waiting on attendee details via checkout link
  "awaiting_payment",  // attendee details submitted, payment link generated
  "paid",
  "cancelled",
  "expired",
]);

export const hotelOrderStatusEnum = pgEnum("hotel_order_status", [
  "pending",
  "awaiting_payment",
  "paid",
  "confirmed",
  "declined",
  "cancelled",
  "expired",
  "refunded",
  "completed",
]);

export const ticketTransferStatusEnum = pgEnum("ticket_transfer_status", [
  "pending",
  "claimed",
  "declined",
  "cancelled",
  "expired",
]);

// Only "approved" events should ever be shown to buyers on WhatsApp.
export const eventApprovalStatusEnum = pgEnum("event_approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const hotelApprovalStatusEnum = pgEnum("hotel_approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const refundStatusEnum = pgEnum("refund_status", [
  "none",        // No refund required
  "pending",     // Waiting for worker
  "processing",  // Worker is calling Paystack
  "completed",   // Successfully refunded
  "failed",      // Last attempt failed
]);

// ==================== TABLES ====================

export enum ScheduledMessageType {
  HOTEL_UPSELL = "HOTEL_UPSELL",
  REFERRAL_UPSELL = "REFERRAL_UPSELL",
  PRE_EVENT_REMINDER = "PRE_EVENT_REMINDER",
}

export enum ScheduledMessageStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SENT = "SENT",
  FAILED = "FAILED",
}

export const scheduledMessages = pgTable(
  "scheduled_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    orderId: uuid("order_id").notNull().references(() => ticketOrders.id, {
      onDelete: "cascade",
    }),

    type: text("type").$type<ScheduledMessageType>().notNull(),

    status: text("status")
      .$type<ScheduledMessageStatus>()
      .default(ScheduledMessageStatus.PENDING)
      .notNull(),

    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),

    sentAt: timestamp("sent_at", { withTimezone: true }),

    payload: jsonb("payload").$type<Record<string, any>>(),

    error: text("error"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("scheduled_messages_due_idx").on(table.status, table.scheduledAt),

    index("scheduled_messages_order_idx").on(table.orderId),
  ]
);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").unique(),
    email: text("email").unique(),
    displayName: text("display_name"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    phone: text("phone").unique(),
    gender: text("gender"),
    locationCountry: text("location_country"),
  },
  (t) => [
    uniqueIndex("profiles_user_id_key").on(t.userId),
    uniqueIndex("profiles_phone_key").on(t.phone),
  ]
);

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),

  isFeatured: boolean("is_featured").notNull().default(false),
  eventCode: text("event_code").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  // References the organizer/admin profile that owns this event. Was a
  // freeform `creator` text field — normalized to point at `profiles.id`
  // so organizer info (name, contact, etc.) is read from the profile
  // instead of being duplicated here.
   geocodedAddress: text("geocoded_address"),
  createdBy: uuid("created_by").notNull().references(() => profiles.id),
  startsAt: timestamp("starts_at", {
    withTimezone: true,
  }).notNull(),

  endsAt: timestamp("ends_at", {
    withTimezone: true,
  }),

  // Kept in sync with startsAt/endsAt at write time (see lib/datetime.ts),
  // formatted as plain 24hr clock text e.g. "12:00" / "20:00", no AM/PM.
  startTime: text("start_time").notNull(),
  endTime: text("end_time"),

  backgroundImageUrl: text("background_image_url").notNull(),
  mobileBannerUrl: text("mobile_banner_url"),
  desktopBannerUrl: text("desktop_banner_url"),

  address: text("address").notNull(),

  locationLat: numeric("location_lat", {
    precision: 10,
    scale: 6,
  }).notNull(),

  isPaid: boolean("is_paid").notNull().default(false),
  ageGroup: text("age_group"),
  genre: text("genre"),
  tags: text("tags").array(),

  locationLng: numeric("location_lng", {
    precision: 10,
    scale: 6,
  }).notNull(),

  maxPerOrder: integer("max_per_order")
    .notNull()
    .default(10),

  // "active" | "cancelled" | "completed" — lifecycle of the event itself.
  status: text("status")
    .notNull()
    .default("active"),

  // Separate from `status`: whether an admin/organizer approval has cleared
  // this event to be shown to buyers on WhatsApp. Only "approved" events are
  // ever surfaced in browsing/search.
  approvalStatus: eventApprovalStatusEnum("approval_status").notNull().default("pending"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("events_code_key").on(t.eventCode),
]);


export const ticketTiers = pgTable("ticket_tiers", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  // Required for paid events; defaults to 0 for free events.
  price: numeric("price", { precision: 10, scale: 2 }).notNull().default("0"),
  // Only meaningful when isUnlimited = false — required (>0) in that case,
  // and left null when isUnlimited = true. Whether a tier is "sold out" is
  // derived (isUnlimited ? false : sold >= quantity), not stored.
  quantity: integer("quantity"),
  isUnlimited: boolean("is_unlimited").notNull().default(false),
  sold: integer("sold").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Ticket order = one WhatsApp "buy N tickets" checkout. Renamed from `orders`.
export const ticketOrders = pgTable("ticket_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  reference: text("reference").notNull(),

  // Column stays `profile_id` (a profile IS the user), but the field is
  // named `userId` in code for clarity/consistency everywhere it's used.
  userId: uuid("user_id")
    .references(() => profiles.id),

  phone: text("phone").notNull(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
  tierId: uuid("ticket_tier_id")
    .notNull()
    .references(() => ticketTiers.id),

  // Email used for guest purchases (optional)
 guestName: text("guest_name"),
guestEmail: text("guest_email"),

  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  serviceFee: numeric("service_fee", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("NGN"),

  // Filled in when the buyer submits the checkout form (name + email per seat)
  items: jsonb("items").$type<OrderItem[]>(),

  status: ticketOrderStatusEnum("status").notNull().default("pending"),
  orderSource: orderSourceEnum("order_source").notNull().default("web"),

  paymentProvider: text("payment_provider").notNull().default("paystack"),
  accessCode: text("access_code"),
  authorizationUrl: text("authorization_url"),

  hotelUpsellSentAt: timestamp("hotel_upsell_sent_at", { withTimezone: true }),
  referralPushSentAt: timestamp("referral_push_sent_at", { withTimezone: true }),
  ticketsDeliveredAt: timestamp("tickets_delivered_at", { withTimezone: true }),
  preEventReminderSentAt: timestamp("pre_event_reminder_sent_at", { withTimezone: true }),

  expiresAt: timestamp("expires_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  expiredAt: timestamp("expired_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (t) => [
  uniqueIndex("ticket_orders_reference_key").on(t.reference),
]);

export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id").references(() => ticketOrders.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").notNull().references(() => events.id),
  tierId: uuid("ticket_tier_id").notNull().references(() => ticketTiers.id),

  // References the profile that owns this ticket. Replaces the old
  // `ownerPhone` text column — the owner's phone is normalized onto
  // `profiles.phone` and should be read from there (via this FK) so it
  // stays in sync if the user later updates it.
  userId: uuid("user_id")
  .references(() => profiles.id),
  attendeeName: text("attendee_name").notNull(),
  attendeeEmail: text("attendee_email"),
  attendeePhone: text("attendee_phone"),

  // Public URL to the generated ticket image (QR + event info), sent over WhatsApp.
  qrCode: text("qr_code").notNull(),
  checkInCode: text("check_in_code").notNull(),

  status: ticketStatusEnum("status").notNull().default("valid"),
  checkedIn: boolean("checked_in").notNull().default(false),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("tickets_check_in_code_key").on(t.checkInCode)]);

// A registration is created any time a ticket order completes (paid OR the
// isPaid=false / amount=0 "free" path, which still runs through the same
// order pipeline — see lib/orders.ts). One row per attendee per event.
export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id").references(() => profiles.id),

    guestName: text("guest_name"),
    guestEmail: text("guest_email"),
    guestPhone: text("guest_phone"),

    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),

    registeredAt: timestamp("registered_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    ticketTierId: uuid("ticket_tier_id").references(() => ticketTiers.id),
  },
  (t) => [
    uniqueIndex("event_registrations_user_id_event_id_key")
      .on(t.userId, t.eventId),

    uniqueIndex("event_registrations_guest_email_event_id_key")
      .on(t.guestEmail, t.eventId),
  ]
);


export const hotelPartners = pgTable("hotel_partners", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profiles.id),

  // Hotel information
  name: text("name").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull().default("Nigeria"),
  city: text("city").notNull(),
  address: text("address").notNull(),

  // Coordinates for distance calculations
  locationLat: numeric("location_lat", {
    precision: 10,
    scale: 6,
  }).notNull(),

  locationLng: numeric("location_lng", {
    precision: 10,
    scale: 6,
  }).notNull(),

  // Contact
  whatsappNumber: text("whatsapp_number").notNull(),

  commissionRate: numeric("commission_rate", {
    precision: 5,
    scale: 2,
  })
    .notNull()
    .default("10.00"),

  bankAccountDetails: jsonb("bank_account_details"),

  approvalStatus: hotelApprovalStatusEnum("approval_status")
    .notNull()
    .default("pending"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  logoUrl: text("logo_url"),

  coverImageUrl: text("cover_image_url"),

  description: text("description"),
  amenities: text("amenities").array(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
},
  (t) => [
    uniqueIndex("hotel_partners_whatsapp_number_key").on(
      t.whatsappNumber
    ),
  ]
);



export const eventApprovals = pgTable("event_approvals", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  status: eventApprovalStatusEnum("status"),
  reviewedBy: uuid("reviewed_by").references(() => profiles.id),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


export const hotelRoomTypes = pgTable("hotel_room_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  hotelId: uuid("hotel_id").notNull().references(() => hotelPartners.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  pricePerNight: numeric("price_per_night", { precision: 10, scale: 2 }).notNull(),
  capacity: integer("capacity").notNull().default(2),
  quantity: integer("quantity").notNull().default(10),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Renamed from `hotelBookings`, to match `ticketOrders`.
export const hotelOrders = pgTable("hotel_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  reference: text("reference").notNull(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  phone: text("phone").notNull(),
  hotelId: uuid("hotel_id").notNull().references(() => hotelPartners.id),
  roomTypeId: uuid("room_type_id").notNull().references(() => hotelRoomTypes.id),
  roomTypeName: text("room_type_name").notNull(),

  checkIn: timestamp("check_in", { withTimezone: true }).notNull(),
  checkOut: timestamp("check_out", { withTimezone: true }).notNull(),
  nights: integer("nights").notNull(),
  guests: integer("guests").notNull(),

  pricePerNight: numeric("price_per_night", { precision: 10, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("NGN"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  serviceFee: numeric("service_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  status: hotelOrderStatusEnum("status").notNull().default("pending"),
  orderSource: orderSourceEnum("order_source").notNull().default("whatsapp"),
  paymentProvider: text("payment_provider").notNull().default("paystack"),
  accessCode: text("access_code"),
  authorizationUrl: text("authorization_url"),

  expiresAt: timestamp("expires_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  // Set when the hotel declines a paid booking request.
  declinedAt: timestamp("declined_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  // Refund lifecycle
refundStatus: refundStatusEnum("refund_status")
  .notNull()
  .default("none"),

// When the refund was successfully completed
refundedAt: timestamp("refunded_at", {
  withTimezone: true,
}),

// Amount refunded (allows partial refunds in the future)
refundAmount: numeric("refund_amount", {
  precision: 10,
  scale: 2,
}),

// Gateway refund/reference ID
refundReference: text("refund_reference"),

// Why the refund happened
refundReason: text("refund_reason"),

// Last error returned by the payment gateway
refundFailureReason: text("refund_failure_reason"),

// Number of retry attempts
refundAttempts: integer("refund_attempts")
  .notNull()
  .default(0),
}, (t) => [uniqueIndex("hotel_orders_reference_key").on(t.reference)]);

// Transfer requires the RECIPIENT to confirm via a link + checkout-style form
// (full name + email), not the sender typing the recipient's details.
export const ticketTransfers = pgTable("ticket_transfers", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  newTicketId: uuid("new_ticket_id").references(() => tickets.id),

  // The sender already has a profile (they own the ticket being sent).
  fromUserId: uuid("from_user_id").notNull().references(() => profiles.id),
  // The recipient may not have a profile yet at the time the transfer is
  // created — this is only resolved (looked up or created) once they
  // actually claim the transfer, so it stays null until then.
  toUserId: uuid("to_user_id").references(() => profiles.id),
  // Temporary contact info used to reach the recipient over WhatsApp and
  // to resolve/create their profile on claim. Not the source of truth for
  // the recipient's phone once they have a profile — `toUserId` is.
  recipientPhone: text("recipient_phone").notNull(),

  status: ticketTransferStatusEnum("status").notNull().default("pending"),
  transferCode: text("transfer_code").notNull(),

  claimedName: text("claimed_name"),
  claimedEmail: text("claimed_email"),

  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  declinedAt: timestamp("declined_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("ticket_transfers_code_key").on(t.transferCode)]);



export const processedPayments = pgTable(
  "processed_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    // Gateway (Paystack today, others later)
    provider: text("provider")
      .notNull()
      .default("paystack"),

    // Paystack transaction reference
    reference: text("reference").notNull(),

    // What kind of payment this was
    paymentType: text("payment_type").notNull(), // ticket | hotel

    // Which user paid
    userId: uuid("user_id")
  .references(() => profiles.id),

    // Which order was fulfilled
    ticketOrderId: uuid("ticket_order_id")
      .references(() => ticketOrders.id, {
        onDelete: "cascade",
      }),

    hotelOrderId: uuid("hotel_order_id")
      .references(() => hotelOrders.id, {
        onDelete: "cascade",
      }),

    // Amount actually confirmed by the gateway
    amount: numeric("amount", {
      precision: 10,
      scale: 2,
    }),

    currency: text("currency")
      .notNull()
      .default("NGN"),

    // Full Paystack response for debugging/auditing
    metadata: jsonb("metadata"),

    processedAt: timestamp("processed_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("processed_payments_reference_key").on(t.reference),
  ]
);










export const organizerProfiles = pgTable(
  "organizer_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => profiles.id),
    brandName: text("brand_name").notNull(),
    bio: text("bio"),
    profilePhotoUrl: text("profile_photo_url"),
    website: text("website"),
    instagram: text("instagram"),
    twitter: text("twitter"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("organizer_profiles_user_id_key").on(t.userId),
  ]
);



export const campaigns = pgTable("campaigns", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  createdBy: uuid("created_by").notNull().references(() => profiles.id),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("email"),
  status: text("status").notNull().default("draft"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  recipientCount: integer("recipient_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const eventGallery = pgTable("event_gallery", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  mediaUrl: text("media_url").notNull(),
  mediaType: text("media_type").notNull().default("image"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const eventLikes = pgTable(
  "event_likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("event_likes_event_id_user_id_key").on(t.eventId, t.userId),
  ]
)





export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  read: boolean("read").notNull().default(false),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const organizerFollows = pgTable(
  "organizer_follows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizerId: uuid("organizer_id").notNull().references(() => organizerProfiles.id),
    followerId: uuid("follower_id").notNull().references(() => profiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("organizer_follows_organizer_id_follower_id_key").on(
      t.organizerId,
      t.followerId
    ),
  ]
);

export const organizerSubscriptions = pgTable("organizer_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  plan: text("plan").notNull().default("on_demand"),
  status: text("status").notNull().default("active"),
  paystackSubscriptionCode: text("paystack_subscription_code"),
  paystackCustomerCode: text("paystack_customer_code"),
  amount: numeric("amount").notNull().default("0"),
  currency: text("currency").notNull().default("NGN"),
  billingCycle: text("billing_cycle").notNull().default("monthly"),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});




export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id),
  role: appRole("role").notNull(),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export const venueMaps = pgTable(
  "venue_maps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    imageUrl: text("image_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("venue_maps_event_id_key").on(t.eventId),
  ]
);

export const venueSections = pgTable("venue_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  eventId: uuid("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  venueMapId: uuid("venue_map_id").notNull().references(() => venueMaps.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#6366f1"),
  capacity: integer("capacity").notNull().default(100),
  ticketTierId: uuid("ticket_tier_id").references(() => ticketTiers.id, { onDelete: "set null" }),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const loyaltyPoints = pgTable("loyalty_points", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  pointsEarned: integer("points_earned").notNull().default(0),
  source: text("source").notNull(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  referenceId: uuid("reference_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});



export const payouts = pgTable("payouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("pending"),
  paystackTransferRef: text("paystack_transfer_ref"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorId: uuid("actor_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: uuid("entity_id").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ==================== RELATIONS ====================

export const profilesRelations = relations(profiles, ({ many, one }) => ({
  ticketOrders: many(ticketOrders),
  hotelOrders: many(hotelOrders),
  eventRegistrations: many(eventRegistrations),
  processedPayments: many(processedPayments),
  tickets: many(tickets),
  eventsCreated: many(events),
  transfersFrom: many(ticketTransfers, { relationName: "transferFromUser" }),
  transfersTo: many(ticketTransfers, { relationName: "transferToUser" }),


  organizerProfile: one(organizerProfiles),
  events: many(events),

  hotelPartners: many(hotelPartners),

  likes: many(eventLikes),
  notifications: many(notifications),
  followsAsFollower: many(organizerFollows, { relationName: "follower" }),
  subscriptions: many(organizerSubscriptions),
  roles: many(userRoles),
  loyaltyPoints: many(loyaltyPoints),
  payouts: many(payouts),
}));




export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(profiles, { fields: [events.createdBy], references: [profiles.id] }),
  ticketTiers: many(ticketTiers),
  ticketOrders: many(ticketOrders),
  tickets: many(tickets),
  registrations: many(eventRegistrations),
  approvals: many(eventApprovals),


  campaigns: many(campaigns),
  gallery: many(eventGallery),
  likes: many(eventLikes),
  venueMap: one(venueMaps),
  venueSections: many(venueSections),
  loyaltyPoints: many(loyaltyPoints),
  hotelOrders: many(hotelOrders),
  eventApproval: one(eventApprovals),
}));






// ==================== TABLE DEFINITIONS ====================









export const ticketOrdersRelations = relations(ticketOrders, ({ one, many }) => ({
  user: one(profiles, { fields: [ticketOrders.userId], references: [profiles.id] }),
  event: one(events, { fields: [ticketOrders.eventId], references: [events.id] }),
  tier: one(ticketTiers, { fields: [ticketOrders.tierId], references: [ticketTiers.id] }),
  tickets: many(tickets),
  payments: many(processedPayments),
}));



export const eventApprovalsRelations = relations(eventApprovals, ({ one }) => ({
  event: one(events, { fields: [eventApprovals.eventId], references: [events.id] }),
}));

export const processedPaymentsRelations = relations(processedPayments, ({ one }) => ({
  user: one(profiles, { fields: [processedPayments.userId], references: [profiles.id] }),
  ticketOrder: one(ticketOrders, { fields: [processedPayments.ticketOrderId], references: [ticketOrders.id] }),
  hotelOrder: one(hotelOrders, { fields: [processedPayments.hotelOrderId], references: [hotelOrders.id] }),
}));




export const organizerProfilesRelations = relations(organizerProfiles, ({ one, many }) => ({
  user: one(profiles, {
    fields: [organizerProfiles.userId],
    references: [profiles.id],
  }),
  followers: many(organizerFollows),
}));






export const campaignsRelations = relations(campaigns, ({ one }) => ({
  event: one(events, {
    fields: [campaigns.eventId],
    references: [events.id],
  }),

  createdBy: one(profiles, {
    fields: [campaigns.createdBy],
    references: [profiles.id],
  }),
}));




export const eventGalleryRelations = relations(eventGallery, ({ one }) => ({
  event: one(events, {
    fields: [eventGallery.eventId],
    references: [events.id],
  }),
}));

export const eventLikesRelations = relations(eventLikes, ({ one }) => ({
  event: one(events, {
    fields: [eventLikes.eventId],
    references: [events.id],
  }),

  user: one(profiles, {
    fields: [eventLikes.userId],
    references: [profiles.id],
  }),
}));



export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  user: one(profiles, { fields: [eventRegistrations.userId], references: [profiles.id] }),
  event: one(events, { fields: [eventRegistrations.eventId], references: [events.id] }),
  tier: one(ticketTiers, { fields: [eventRegistrations.ticketTierId], references: [ticketTiers.id] }),
}));



export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.userId],
    references: [profiles.id],
  }),
  event: one(events, {
    fields: [notifications.eventId],
    references: [events.id],
  }),
}));

export const organizerFollowsRelations = relations(organizerFollows, ({ one }) => ({
  organizer: one(organizerProfiles),
  follower: one(profiles),
}));

export const organizerSubscriptionsRelations = relations(organizerSubscriptions, ({ one }) => ({
  user: one(profiles),
}));

export const ticketTiersRelations = relations(ticketTiers, ({ one, many }) => ({
  event: one(events, {
    fields: [ticketTiers.eventId],
    references: [events.id],
    relationName: "event_ticketTiers",
  }),
  tickets: many(tickets),
  venueSections: many(venueSections),
  ticketOrders: many(ticketOrders),
  registrations: many(eventRegistrations),
}));






export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  order: one(ticketOrders, { fields: [tickets.orderId], references: [ticketOrders.id] }),
  event: one(events, { fields: [tickets.eventId], references: [events.id] }),
  tier: one(ticketTiers, { fields: [tickets.tierId], references: [ticketTiers.id] }),
  user: one(profiles, { fields: [tickets.userId], references: [profiles.id] }),
  transfers: many(ticketTransfers),
}));







export const venueMapsRelations = relations(venueMaps, ({ one, many }) => ({
  event: one(events),
  sections: many(venueSections),
}));

export const venueSectionsRelations = relations(venueSections, ({ one }) => ({
  event: one(events),
  venueMap: one(venueMaps),
  ticketTier: one(ticketTiers),
}));

export const loyaltyPointsRelations = relations(loyaltyPoints, ({ one }) => ({
  user: one(profiles),
  event: one(events),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  user: one(profiles),
  event: one(events),
}));





export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(profiles),
}));



export const auditLogsRelations = relations(auditLogs, () => ({}));




export const hotelPartnersRelations = relations(hotelPartners, ({ one, many }) => ({
  user: one(profiles, {
    fields: [hotelPartners.userId],
    references: [profiles.id],
  }),

  roomTypes: many(hotelRoomTypes),

  hotelOrders: many(hotelOrders),
}));


export const hotelRoomTypesRelations = relations(hotelRoomTypes, ({ one, many }) => ({
  hotel: one(hotelPartners, { fields: [hotelRoomTypes.hotelId], references: [hotelPartners.id] }),
  hotelOrders: many(hotelOrders),
}));

export const hotelOrdersRelations = relations(hotelOrders, ({ one, many }) => ({
  user: one(profiles, { fields: [hotelOrders.userId], references: [profiles.id] }),
  hotel: one(hotelPartners, { fields: [hotelOrders.hotelId], references: [hotelPartners.id] }),
  roomType: one(hotelRoomTypes, { fields: [hotelOrders.roomTypeId], references: [hotelRoomTypes.id] }),
  payments: many(processedPayments),
}));




export const ticketTransfersRelations = relations(ticketTransfers, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketTransfers.ticketId], references: [tickets.id] }),
  newTicket: one(tickets, { fields: [ticketTransfers.newTicketId], references: [tickets.id] }),
  fromUser: one(profiles, {
    fields: [ticketTransfers.fromUserId],
    references: [profiles.id],
    relationName: "transferFromUser",
  }),
  toUser: one(profiles, {
    fields: [ticketTransfers.toUserId],
    references: [profiles.id],
    relationName: "transferToUser",
  }),
}));



// ==================== INSERT SCHEMAS ====================

export const insertProfileSchema = createInsertSchema(profiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertOrganizerProfileSchema = createInsertSchema(organizerProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true, createdAt: true });
export const insertEventGallerySchema = createInsertSchema(eventGallery).omit({ id: true, createdAt: true });
export const insertEventLikeSchema = createInsertSchema(eventLikes).omit({ id: true, createdAt: true });
export const insertEventRegistrationSchema = createInsertSchema(eventRegistrations).omit({ id: true, registeredAt: true });
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertOrganizerSubscriptionSchema = createInsertSchema(organizerSubscriptions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTicketTierSchema = createInsertSchema(ticketTiers).omit({ id: true, createdAt: true });
export const insertTicketSchema = createInsertSchema(tickets).omit({ id: true, createdAt: true });
export const insertVenueMapSchema = createInsertSchema(venueMaps).omit({ id: true, createdAt: true });
export const insertVenueSectionSchema = createInsertSchema(venueSections).omit({ id: true, createdAt: true });
export const insertLoyaltyPointSchema = createInsertSchema(loyaltyPoints).omit({ id: true, createdAt: true });
export const insertPayoutSchema = createInsertSchema(payouts).omit({ id: true, createdAt: true });
export const insertEventApprovalSchema = createInsertSchema(eventApprovals).omit({ id: true, createdAt: true });
export const insertTicketOrderSchema = createInsertSchema(ticketOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
  cancelledAt: true,
  expiredAt: true,
  referralPushSentAt: true,
  hotelUpsellSentAt: true,
  ticketsDeliveredAt: true,
  preEventReminderSentAt: true,
  expiresAt: true,
});

export const insertHotelPartnerSchema = createInsertSchema(hotelPartners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertHotelRoomTypeSchema = createInsertSchema(hotelRoomTypes).omit({
  id: true,
  createdAt: true,
});

export const insertHotelOrderSchema = createInsertSchema(hotelOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
  cancelledAt: true,
  expiresAt: true,
});

export const insertTicketTransferSchema = createInsertSchema(ticketTransfers).omit({
  id: true,
  createdAt: true,
  claimedAt: true,
  declinedAt: true,
  cancelledAt: true,
});

export const insertProcessedPaymentSchema = createInsertSchema(processedPayments).omit({
  id: true,
  processedAt: true,
});

export const insertOrganizerFollowSchema = createInsertSchema(organizerFollows).omit({
  id: true,
  createdAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});











// ==================== TYPES ====================

export type Profile = typeof profiles.$inferSelect;
export type Event = typeof events.$inferSelect;
export type OrganizerProfile = typeof organizerProfiles.$inferSelect;
export type NewOrganizerProfile = typeof organizerProfiles.$inferInsert;
export type TicketTier = typeof ticketTiers.$inferSelect;
export type TicketOrder = typeof ticketOrders.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type HotelPartner = typeof hotelPartners.$inferSelect;
export type HotelRoomType = typeof hotelRoomTypes.$inferSelect;
export type HotelOrder = typeof hotelOrders.$inferSelect;
export type TicketTransfer = typeof ticketTransfers.$inferSelect;
export type EventApproval = typeof eventApprovals.$inferSelect;
export type ProcessedPayment = typeof processedPayments.$inferSelect;


export type NewEvent = typeof events.$inferInsert;
export type NewTicketTier = typeof ticketTiers.$inferInsert;
export type NewTicketOrder = typeof ticketOrders.$inferInsert;
export type NewTicket = typeof tickets.$inferInsert;
export type NewEventRegistration = typeof eventRegistrations.$inferInsert;
export type NewHotelPartner = typeof hotelPartners.$inferInsert;
export type NewHotelRoomType = typeof hotelRoomTypes.$inferInsert;
export type NewHotelOrder = typeof hotelOrders.$inferInsert;



export type HotelOrderWithDetails = HotelOrder & {
  guestName: string | null;
  guestPhone: string | null;
  guestEmail: string | null;
  hotelName: string | null;
};