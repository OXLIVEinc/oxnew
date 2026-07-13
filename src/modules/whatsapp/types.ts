// ---------------------------------------------------------------------------
// Conversation state machine
// ---------------------------------------------------------------------------

import { findHotelOrderByReference } from "./data/db";

export type ConversationState =
  | 'FRESH'
  | 'MAIN_MENU'
  | 'BOOKING_KIND_SELECT'
  | 'BROWSE_EVENTS'
  | 'BROWSE_RESULTS'
  | 'EVENT_SELECT_TIER'
  | 'EVENT_QTY'
  | 'EVENT_CHECKOUT_PENDING'
  | 'HOTEL_SEARCH'
  | 'HOTEL_SELECT'
  | 'HOTEL_SELECT_ROOM'
  | 'HOTEL_DATES'
  | 'HOTEL_GUESTS'
  | 'HOTEL_ORDER_PENDING'
  | 'HOTEL_UPSELL_OFFER'
  | 'HOTEL_CONFIRM_ACTION'
  | 'TRANSFER_INIT'
  | 'TRANSFER_SELECT_TICKET'
  | 'TRANSFER_RECIPIENT_PHONE'
  | 'TRANSFER_CONFIRM'
  | 'CHECK_BOOKINGS'
  | 'PAUSED_CHOICE'
  | 'HELP'
  | "HOTEL_HOME"
  | "HOTEL_CONFIRM_ACTION";

export interface EventSearchResultItem {
  id: string;
  eventCode: string;
  name: string;
  dateLabel: string;
  isPaid:boolean;
}

export interface HotelResultItem {
  id: string;
  name: string;
  distanceKm?: number;
}

export interface RoomResultItem {
  id: string;
  name: string;
  pricePerNight: number;
  capacity: number;
}

export interface HotelUpsellOfferItem {
  id: string;
  name: string;
  pricePerNight: number;
  distanceKm: number;
}

/**
 * Freeform bag of data accumulated as a buyer moves through a flow. Kept
 * flat and small on purpose — this whole object gets serialized into Redis
 * on every turn, so avoid stuffing full DB rows in here; store ids + the
 * handful of display fields each step actually needs.
 */
export interface ConversationContext {
  // booking-kind selector (tickets vs hotel vs both)
  bookingKind?: 'tickets' | 'hotel' | 'both';

  // event flow
  eventId?: string;
  eventCode?: string;
  eventName?: string;
  eventDateLabel?: string;
  eventTimeLabel?: string;
  eventAddress?: string;
  eventBackgroundImageUrl?: string;
  maxPerOrder?: number;
  tierOptions?: { id: string; label: string; price: number }[];
  roomCapacity?: number, // <-- add this
   eventIsPaid?: boolean;

  tierId?: string;
  tierLabel?: string;
  tierPrice?: number;

  qty?: number;
  orderId?: string;
  orderReference?: string;
  checkoutLink?: string;

  // browsing / pagination — "more" re-queries the DB for the next page
  // rather than caching everything up front.
  browseQuery?: string;
  browseOffset?: number;
  searchResults?: EventSearchResultItem[];

  // hotel flow
  city?: string;
  hotelOffset?: number;
  hotelResults?: HotelResultItem[];
  hotelId?: string;
  hotelName?: string;

  roomResults?: RoomResultItem[];
  roomTypeId?: string;
  roomTypeName?: string;
  pricePerNight?: number;

  checkIn?: string;
  checkOut?: string;
  nights?: number;
  guests?: number;
  total?: number;
  hotelOrderId?: string;
  paymentLink?: string;

  // post-purchase hotel upsell (triggered by a delayed queue job, not the
  // buyer's own navigation)
  hotelUpsellOffers?: HotelUpsellOfferItem[];
  hotelUpsellEventId?: string;

  // "my bookings" pagination
  ordersOffset?: number;

  // transfer flow
  transferable?: { id: string; ref: string; eventName: string; tierLabel: string }[];
  ticketId?: string;
  ticketRef?: string;
  ticketEventName?: string;
  ticketTierLabel?: string;
  recipientPhone?: string;

   hotelAction?: {
    action: 'CONFIRM' | 'DECLINE';
    reference: string;
  };
  

  // Stashed here while we ask "resume paused booking, or start this new
  // one?" (PAUSED_CHOICE state) — whichever the buyer picks, we either
  // restore session.paused or apply this pending action.
  pendingStart?: {
    nextState: ConversationState;
    contextPatch?: Partial<ConversationContext>;
    reply?: string | null;
  };


ticketOrderExpiresAt?: string;
hotelOrderExpiresAt?: string;
}

export interface Session {
  phone: string;
  state: ConversationState;
  context: ConversationContext;
  updatedAt: number;

  lastPrompt?: string;
  lastCta?: BotReply["cta"];

  paused?: {
    state: ConversationState;
    context: ConversationContext;
    lastPrompt?: string;
    lastCta?: BotReply["cta"];
  };
}



/**
 * A WhatsApp "cta_url" interactive message — a proper clickable button
 * instead of a bare link pasted into text. Used for anything the buyer
 * needs to tap through to a web view: ticket checkout, hotel order
 * review, transfer claim.
 */
export interface CtaUrlPayload {
  bodyText?: string;
  footerText?: string;
  buttonText: string;
  url: string;
}

/**
 * What every flow-handler function returns: an optional next state +
 * context patch to apply, and the reply text to send back (if any).
 */
export interface FlowResult {
  nextState?: ConversationState;
  contextPatch?: Partial<ConversationContext>;
  reply?: string | null;
  followUp?: string;
  cta?: CtaUrlPayload;
}

/** What the router hands back to the caller (server.ts / simulate.ts). */
export interface BotReply {
  reply: string | null;
  followUp?: string;
  cta?: CtaUrlPayload;
}

export type PaymentKind = 'event' | 'hotel';


export type HotelOrderWithDetails = NonNullable<
  Awaited<ReturnType<typeof findHotelOrderByReference>>
>;