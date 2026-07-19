import * as db from '../../data/db';
import { naira, asNumberChoice, isMoreCommand, formatDate, FALLBACK } from '../helpers';
import { parseFriendlyDate, friendlyDateFormatHint } from '../../lib/datetime';
import { ConversationContext, FlowResult, HotelResultItem } from '../../types';
import { sendMessage, sendReplyButtonsMessage } from '../messenger';
import { getExpiryFooter } from '../helpers';

const CHECKOUT_BASE_URL = process.env.CHECKOUT_BASE_URL || 'https://ox.app';

// Step 1: country
export async function handleCountryInput(text: string): Promise<FlowResult> {
  const country = text.trim();
  if (!country) return { reply: FALLBACK() };

  return {
    nextState: 'HOTEL_SEARCH_STATE',
    contextPatch: { country },
    reply: `Got it — ${country}.\n\nWhich state or region? (e.g. Lagos, Greater Accra, London)`,
  };
}

// Step 2: state -> first page of hotels in country+state
export async function handleStateInput(text: string, context: ConversationContext): Promise<FlowResult> {
  const hotelState = text.trim();
  if (!hotelState || !context.country) return { reply: FALLBACK() };

  return renderHotelsPage(context.country, hotelState, await db.searchHotels(context.country, hotelState, 0));
}

export async function handleStateResultsMore(context: ConversationContext): Promise<FlowResult> {
  const country = context.country || '';
  const hotelState = context.hotelState || '';
  const offset = context.hotelOffset ?? 0;
  return renderHotelsPage(country, hotelState, await db.searchHotels(country, hotelState, offset), true);
}

async function renderHotelsPage(
  country: string,
  hotelState: string,
  page: db.Page<db.HotelPartnerRow>,
  isMorePage = false
): Promise<FlowResult> {
  if (page.items.length === 0 && !isMorePage) {
    return {
      reply:
        `We don't have hotels listed in ${hotelState}, ${country} yet.\n\n` +
        `Try another state or country, or type MENU to go back.`,
    };
  }
  if (page.items.length === 0 && isMorePage) {
    return { reply: `That's every hotel we have in ${hotelState}, ${country}. Type MENU for more options.` };
  }

  const results: HotelResultItem[] = page.items.map((h) => ({ id: h.id, name: h.name }));
  const list = results.map((h, i) => `${i + 1}. ${h.name}`).join('\n');
  const more = page.hasMore ? `\n\nReply MORE to see more hotels.` : '';

  return {
    nextState: 'HOTEL_SELECT',
    contextPatch: { country, hotelState, hotelResults: results, hotelOffset: page.nextOffset },
    reply: `Hotels in ${hotelState}, ${country}:\n\n${list}${more}\n\nReply with a number to select.`,
  };
}

// hotel choice, or MORE -> list of room types
export async function handleHotelSelection(text: string, context: ConversationContext): Promise<FlowResult> {
  if (isMoreCommand(text)) return handleStateResultsMore(context);

  const hotels = context.hotelResults || [];
  const choice = asNumberChoice(text, 1, hotels.length);
  if (choice === null) return { reply: FALLBACK() };

  const hotel = hotels[choice - 1];
  const rooms = await db.getRoomTypesForHotel(hotel.id);

  if (rooms.length === 0) {
    return { reply: `${hotel.name} doesn't have any rooms available right now. Type MENU to go back.` };
  }

  const list = rooms
    .map((r, i) => `${i + 1}. ${r.name} - ${naira(Number(r.pricePerNight))}/night (sleeps ${r.capacity})`)
    .join('\n');

  return {
    nextState: 'HOTEL_SELECT_ROOM',
    contextPatch: {
      hotelId: hotel.id,
      hotelName: hotel.name,
      roomResults: rooms.map((r) => ({
        id: r.id,
        name: r.name,
        pricePerNight: Number(r.pricePerNight),
        capacity: r.capacity,
      })),
    },
    reply: `Room types at ${hotel.name}:\n\n${list}\n\nReply with a number to select.`,
  };
}

// room type -> ask for check-in/check-out dates
export async function handleRoomTypeSelection(text: string, context: ConversationContext): Promise<FlowResult> {
  const rooms = context.roomResults || [];
  const choice = asNumberChoice(text, 1, rooms.length);
  if (choice === null) return { reply: FALLBACK() };

  const room = rooms[choice - 1];
  return {
    nextState: 'HOTEL_DATES',
    contextPatch: { roomTypeId: room.id, roomTypeName: room.name, pricePerNight: room.pricePerNight,
         roomCapacity: room.capacity, 
     },
    reply:
      `${room.name} - ${naira(room.pricePerNight)}/night.\n\n` +
      `Please enter your check-in and check-out dates, one at a time, in this format: ${friendlyDateFormatHint()}\n\n` +
      `First - what's your check-in date?`,
  };
}

// dates -> ask number of guests
// Two-step so we can validate each date individually with a friendly retry
// prompt, instead of one combined string that's easy to get wrong.

export async function handleDatesInput(
  text: string,
  context: ConversationContext
): Promise<FlowResult> {
  // Step 1: Collect check-in date
  if (!context.checkIn) {
    const result = parseFriendlyDate(text);

    if (!result.ok) {
      return {
        reply: result.error!,
      };
    }

    return {
      nextState: 'HOTEL_DATES',
      contextPatch: {
        checkIn: result.date!.toISOString(),
      },
      reply: `Got it. Now - what's your check-out date? (${friendlyDateFormatHint()})`,
    };
  }

  // Step 2: Collect check-out date
  const result = parseFriendlyDate(text);

  if (!result.ok) {
    return {
      reply: result.error!,
    };
  }

  const checkOut = result.date!;
  const checkIn = new Date(context.checkIn);

  if (checkOut <= checkIn) {
    return {
      reply: `Your check-out date needs to be after your check-in date (${formatDate(checkIn)}). Please try again.`,
    };
  }

  const nights = Math.round(
    (checkOut.getTime() - checkIn.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return {
    nextState: 'HOTEL_GUESTS',
    contextPatch: {
      checkOut: checkOut.toISOString(),
      nights,
    },
    reply:
      `How many guests will be staying?\n\n` +
      `1. 1 guest\n` +
      `2. 2 guests\n` +
      `3. 3 guests\n` +
      `4. 4 guests`,
  };
}

// guests -> create the order (no payment initialized yet) -> send a review
// link. The buyer reviews everything on that page and only then taps
// "Proceed to pay" — for a free booking, the page registers it directly
// without touching Paystack at all. This mirrors the ticket flow, where
// the order also exists before any payment step.
export async function handleGuestsInput(text: string, context: ConversationContext, phone: string): Promise<FlowResult> {
  const guests = asNumberChoice(text, 1, 10);
  if (guests === null) return { reply: FALLBACK() };

  const nights = context.nights || 1;


   const capacity = context.roomCapacity ?? 1;

  if (guests > capacity) {
    return {
      reply:
        `Sorry, this room can accommodate a maximum of ${capacity} guest${
          capacity > 1 ? "s" : ""
        }.\n\n` +
        `Please reply with a number between 1 and ${capacity}.`,
    };
  }

  const order = await db.createHotelOrder({
    phone,
    hotelId: context.hotelId!,
    roomTypeId: context.roomTypeId!,
    roomTypeName: context.roomTypeName!,
    checkIn: new Date(context.checkIn!),
    checkOut: new Date(context.checkOut!),
    nights,
    guests,
    pricePerNight: context.pricePerNight!,
  });

  const reviewLink = `${CHECKOUT_BASE_URL}/hotel-order/${order.id}`;

  return {
    nextState: 'HOTEL_ORDER_PENDING',
    contextPatch: { guests, total: Number(order.amount), hotelOrderId: order.id, paymentLink: reviewLink,
      hotelOrderExpiresAt: order.expiresAt?.toISOString(),
     },
    reply: null,
cta: {
  bodyText:
    `Your booking request has been created.\n\n` +
    `${context.hotelName} - ${context.roomTypeName}\n` +
    `${formatDate(context.checkIn!)} to ${formatDate(context.checkOut!)} (${nights} night${nights > 1 ? 's' : ''})\n` +
    `${guests} guest${guests > 1 ? 's' : ''} | Total: ${naira(Number(order.amount))}\n` +
    `Ref: ${order.reference}\n\n` +
    `Tap below to review your booking and complete it. This link expires in 30 minutes.`,
  footerText: getExpiryFooter(order.expiresAt!),
  buttonText: "Review & Pay",
  url: reviewLink,
},
  };
}

// Called once the Paystack webhook confirms payment (or once a free booking
// is registered directly) — independent of session state.
export async function deliverConfirmedHotelOrder(order: db.HotelOrderRow): Promise<void> {
  const hotel = await db.getHotelById(order.hotelId);

  await sendMessage(
    order.phone,
    `Booking confirmed.\n\n` +
      `${hotel?.name ?? 'Your hotel'}\n` +
      `${order.roomTypeName}\n` +
      `${formatDate(order.checkIn)} to ${formatDate(order.checkOut)} (${order.nights} night${order.nights > 1 ? 's' : ''})\n` +
      `${order.guests} guest${order.guests > 1 ? 's' : ''}\n` +
      `Paid: ${naira(Number(order.amount))}\n` +
      `Ref: ${order.reference}\n\n` +
      `Show this confirmation at check-in. Have a great stay.`
  );
}

/**
 * Fired right after payment clears (or a free booking is registered) —
 * lets the hotel know a booking is waiting on their acceptance, and how to
 * respond. They have 30 minutes before it auto-expires (enforced by an
 * external cron job).
 */
export async function notifyHotelOfBooking(order: db.HotelOrderRow): Promise<void> {
  const hotel = await db.getHotelById(order.hotelId);
  if (!hotel) return;

  await sendReplyButtonsMessage(hotel.whatsappNumber, {
  bodyText:
    `New booking request\n\n` +
    `${order.roomTypeName}\n` +
    `${formatDate(order.checkIn)} to ${formatDate(order.checkOut)}\n` +
    `${order.guests} guest${order.guests > 1 ? "s" : ""}\n` +
    `Amount: ${naira(Number(order.amount))}\n` +
    `Ref: ${order.reference}`,

  footerText: "Respond within 30 minutes.",

  buttons: [
    {
      id: `hotel_confirm:${order.reference}`,
      title: "✅ Confirm",
    },
    {
      id: `hotel_decline:${order.reference}`,
      title: "❌ Decline",
    },
  ],
});
}

/** Fired when the hotel declines a booking request — lets the guest know. */
export async function notifyGuestOfDecline(order: db.HotelOrderRow): Promise<void> {
  await sendMessage(
    order.phone,
    `Sorry - your booking request (Ref: ${order.reference}) was declined by the hotel.\n\n` +
      `${Number(order.amount) > 0 ? "You'll be refunded shortly. " : ''}Type MENU to search for another hotel.`
  );
}

// ---------------------------------------------------------------------------
// Post-purchase hotel upsell offer (Step 6) — triggered by the delayed
// queue job, not the buyer's own navigation. Picking a number jumps
// straight into room-type selection for that hotel; SKIP returns to menu.
// ---------------------------------------------------------------------------

export async function handleUpsellOfferInput(text: string, context: ConversationContext): Promise<FlowResult> {
  const trimmed = text.trim().toLowerCase();
  if (trimmed === 'skip') {
    return { nextState: 'MAIN_MENU', reply: `No worries. Type MENU any time you need OX.` };
  }

  const offers = context.hotelUpsellOffers || [];
  const choice = asNumberChoice(text, 1, offers.length);
  if (choice === null) {
    return { reply: `Reply with a number to book, or SKIP to dismiss.` };
  }

  const offer = offers[choice - 1];
  const rooms = await db.getRoomTypesForHotel(offer.id);
  if (rooms.length === 0) {
    return { nextState: 'MAIN_MENU', reply: `That hotel has no rooms available right now. Type MENU for options.` };
  }

  const list = rooms
    .map((r, i) => `${i + 1}. ${r.name} - ${naira(Number(r.pricePerNight))}/night (sleeps ${r.capacity})`)
    .join('\n');

  return {
    nextState: 'HOTEL_SELECT_ROOM',
    contextPatch: {
      hotelId: offer.id,
      hotelName: offer.name,
      roomResults: rooms.map((r) => ({
        id: r.id,
        name: r.name,
        pricePerNight: Number(r.pricePerNight),
        capacity: r.capacity,
      })),
    },
    reply: `Room types at ${offer.name}:\n\n${list}\n\nReply with a number to select.`,
  };
}




/** Fired when the hotel marks the guest as checked in. */
export async function notifyGuestCheckedIn(
  order: db.HotelOrderRow
): Promise<void> {
  const hotel = await db.getHotelById(order.hotelId);

  await sendMessage(
    order.phone,
    `You've successfully checked in.\n\n` +
      `${hotel?.name ?? "Your hotel"}\n` +
      `${order.roomTypeName}\n` +
      `${formatDate(order.checkIn)} to ${formatDate(order.checkOut)} (${order.nights} night${order.nights > 1 ? "s" : ""})\n\n` +
      `We hope you enjoy your stay.`
  );
}

/** Fired when the hotel marks the stay as completed. */
export async function notifyGuestStayCompleted(
  order: db.HotelOrderRow
): Promise<void> {
  const hotel = await db.getHotelById(order.hotelId);

  await sendMessage(
    order.phone,
    `Your stay has been marked as completed.\n\n` +
      `${hotel?.name ?? "Your hotel"}\n` +
      `Ref: ${order.reference}\n\n` +
      `Thank you for booking with OX. We hope to host you again soon.`
  );
}