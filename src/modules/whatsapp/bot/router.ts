import { getSession, setState, pauseSession, resumeSession, clearPaused, hasPausedSession } from './session';
import { isDeepLinkCode, isGlobalCommand, isMoreCommand, parseCancelOrderCommand, HELP_MESSAGE, FALLBACK } from './helpers';
import * as db from '../data/db';
import { BotReply, ConversationContext, FlowResult } from '../types';

import * as mainMenu from './flows/mainMenu';
import * as eventFlow from './flows/eventFlow';
import * as hotelFlow from './flows/hotelFlow';
import * as transferFlow from './flows/transferFlow';
import * as ordersFlow from './flows/ordersFlow';

export { resetSession } from './session';

const PAUSED_CHOICE_PROMPT =
  `You have a paused booking. Would you like to:\n\n` +
  `1. Resume it\n` +
  `2. Start a new one instead\n\n` +
  `Reply with a number 1-2.`;

/**
 * The single entry point. Call this for every inbound WhatsApp message.
 *
 * @param phone  - buyer's WhatsApp number, e.g. "2348123456789"
 * @param text   - raw message text the buyer sent
 * @param waName - the buyer's WhatsApp display name from the webhook
 *                 payload, if available. Used as a fallback greeting name
 *                 for anyone without a profile display name yet.
 * @returns what to send back. `followUp` (if present) should be sent as a
 *          second message.
 */
export async function handleMessage(phone: string, text: string, waName?: string | null): Promise<BotReply> {
  const trimmed = (text || '').trim();

  // -------------------------------------------------------------------
  // 0. A hotel partner replying CONFIRM/DECLINE <ref> to a paid booking
  // request — handled independently of the buyer session state machine,
  // since the hotel is a different party in the conversation.
  // -------------------------------------------------------------------
  const hotelReply = await tryHandleHotelReply(phone, trimmed);
  if (hotelReply) return hotelReply;

  // -------------------------------------------------------------------
  // 0b. "CANCEL <reference>" manually cancels a pending order/booking/
  // transfer from ANY state, without disturbing whatever flow the buyer
  // is currently in (unlike PAUSE, which stops the current flow).
  // -------------------------------------------------------------------
  const cancelRef = parseCancelOrderCommand(trimmed);
  if (cancelRef) {
    const result = await ordersFlow.cancelPendingItem(phone, cancelRef);
    return { reply: result.reply ?? null };
  }

  const session = await getSession(phone);

  console.log({
    state: session.state,
    text: trimmed,
  });

  // -------------------------------------------------------------------
  // 1. Global commands work from any state
  // -------------------------------------------------------------------
  if (isGlobalCommand(trimmed)) {
    const cmd = trimmed.toLowerCase();

    if (cmd === 'help') {
      // don't overwrite state — remember where they were, HELP is just a detour
      return { reply: HELP_MESSAGE() };
    }

    if (cmd === 'pending') {
      const result = await ordersFlow.showPending(phone);
      return { reply: result.reply ?? null };
    }

    if (cmd === 'pause') {
      // Nothing to pause if they're already idle at the menu.
      if (session.state === 'MAIN_MENU' || session.state === 'FRESH') {
        await setState(phone, 'MAIN_MENU', {});
        return { reply: mainMenu.showMainMenu(false, await greetingName(phone, waName)) };
      }
      // Otherwise stash exactly where they were before wiping to the menu,
      // and tell them RESUME will bring it back.
      await pauseSession(phone);
      return {
        reply: `Your progress has been paused.\n\n` + mainMenu.showMainMenu(true),
      };
    }

    if (cmd === 'resume') {
      const resumed = await resumeSession(phone);
      if (!resumed) {
        return { reply: `There's nothing to resume right now.\n\n` + mainMenu.showMainMenu(false, await greetingName(phone, waName)) };
      }
      return {
        reply: `Picking up where you left off.\n\n${resumed.lastPrompt || mainMenu.showMainMenu(false)}`,
      };
    }

    if (cmd === 'menu') {
      const paused = !!(await getSession(phone)).paused;
      await setState(phone, 'MAIN_MENU', {});
      return { reply: mainMenu.showMainMenu(paused, await greetingName(phone, waName)) };
    }
  }

  // -------------------------------------------------------------------
  // 2. Very first message ever (or after reset): decide deep-link vs greeting
  // -------------------------------------------------------------------
  if (session.state === 'FRESH') {
    if (isDeepLinkCode(trimmed)) {
      const event = await db.findEventByCode(trimmed);
      if (event) {
        return apply(phone, await eventFlow.enterViaDeepLink(event));
      }
      await setState(phone, 'MAIN_MENU', {});
      return {
        reply: `We couldn't find an event for that code.\n\n` + mainMenu.showMainMenu(false, await greetingName(phone, waName)),
      };
    }

    await setState(phone, 'MAIN_MENU', {});
    return { reply: mainMenu.showMainMenu(false, await greetingName(phone, waName)) };
  }

  // -------------------------------------------------------------------
  // 3. A deep-link code sent mid-conversation always takes priority
  // -------------------------------------------------------------------
  if (isDeepLinkCode(trimmed)) {
    const event = await db.findEventByCode(trimmed);
    if (event) {
      return await maybeGatePaused(phone, await eventFlow.enterViaDeepLink(event));
    }
  }

  // -------------------------------------------------------------------
  // 4. Route by current state
  // -------------------------------------------------------------------
  const { state, context } = session;

  switch (state) {
    case 'MAIN_MENU': {
      const result = mainMenu.handleMainMenuInput(trimmed);
      if (result.nextState === 'HELP') {
        await setState(phone, 'MAIN_MENU', {});
        return { reply: HELP_MESSAGE() };
      }
      // Browsing events, searching hotels, and starting a transfer all
      // count as "starting something new" — gate them behind a paused
      // flow, if one exists.
      if (result.nextState === 'BROWSE_EVENTS' || result.nextState === 'HOTEL_SEARCH') {
        return await maybeGatePaused(phone, result);
      }
      if (result.nextState === 'TRANSFER_INIT') {
        return await maybeGatePaused(phone, await transferFlow.initTransfer(phone));
      }
      return apply(phone, result);
    }

    // "My bookings" first asks whether they want tickets, hotel bookings, or both
    case 'BOOKING_KIND_SELECT': {
      const result = mainMenu.handleBookingKindInput(trimmed);
      if (result.nextState === 'CHECK_BOOKINGS') {
        return apply(phone, await ordersFlow.showBookings(phone, result.contextPatch?.bookingKind, 0));
      }
      return apply(phone, result);
    }

    case 'BROWSE_EVENTS':
      return apply(phone, await eventFlow.handleBrowseInput(trimmed));

    case 'BROWSE_RESULTS':
      return apply(phone, await eventFlow.handleBrowseResultsInput(trimmed, context));

    case 'EVENT_SELECT_TIER':
      return apply(phone, await eventFlow.handleTierSelection(trimmed, context));

    case 'EVENT_QTY':
      return apply(phone, await eventFlow.handleQtyInput(trimmed, context, phone));

    case 'EVENT_CHECKOUT_PENDING':
      // Buyer is texting while we wait for them to finish the checkout link
      // (attendee details + payment) and for the Paystack webhook to land.
      return {
  reply: null,
  cta: context.checkoutLink
    ? {
        bodyText:
          "Still waiting for your checkout to be completed.\n\nReply HELP if you're having trouble, or PAUSE to set this order aside.",
        footerText: "Expires in 30 minutes",
        buttonText: "Complete Checkout",
        url: context.checkoutLink,
      }
    : undefined,
};

    case 'HOTEL_SEARCH':
      return apply(phone, await hotelFlow.handleCityInput(trimmed));

    case 'HOTEL_SELECT':
      return apply(phone, await hotelFlow.handleHotelSelection(trimmed, context));

    case 'HOTEL_SELECT_ROOM':
      return apply(phone, await hotelFlow.handleRoomTypeSelection(trimmed, context));

    case 'HOTEL_DATES':
      return apply(phone, await hotelFlow.handleDatesInput(trimmed, context));

    case 'HOTEL_GUESTS':
      return apply(phone, await hotelFlow.handleGuestsInput(trimmed, context, phone));

    case 'HOTEL_ORDER_PENDING':
      return {
  reply: null,
  cta: context.paymentLink
    ? {
        bodyText:
          "Your hotel booking is waiting to be completed.\n\nTap the button below to review your booking and complete payment. Reply HELP if you're having trouble, or PAUSE to set this booking aside.",
        footerText: "Expires in 30 minutes",
        buttonText: "Review & Pay",
        url: context.paymentLink,
      }
    : undefined,
};

    // A post-purchase upsell nudge sent by the hotel_upsell queue job
    case 'HOTEL_UPSELL_OFFER':
      return apply(phone, await hotelFlow.handleUpsellOfferInput(trimmed, context));

    case 'TRANSFER_INIT':
      return apply(phone, await transferFlow.initTransfer(phone));

    case 'TRANSFER_SELECT_TICKET':
      return apply(phone, await transferFlow.handleTicketSelection(trimmed, context));

    case 'TRANSFER_RECIPIENT_PHONE':
      return apply(phone, await transferFlow.handleRecipientPhone(trimmed, context));

    case 'TRANSFER_CONFIRM':
      return apply(phone, await transferFlow.handleConfirm(trimmed, context, phone));

    case 'CHECK_BOOKINGS': {
      if (isMoreCommand(trimmed)) {
        return apply(phone, await ordersFlow.showBookings(phone, context.bookingKind, context.ordersOffset));
      }
      return {
        reply: `Reply MORE to see more bookings, PENDING to view items you can cancel, or type MENU for options.`,
      };
    }

    case 'PAUSED_CHOICE':
      return await handlePausedChoice(phone, trimmed, context);

    case 'HELP':
      await setState(phone, 'MAIN_MENU', {});
      return { reply: HELP_MESSAGE() };

    default:
      await setState(phone, 'MAIN_MENU', {});
      return { reply: mainMenu.showMainMenu(false, await greetingName(phone, waName)) };
  }
}

// Resolves the buyer's display name for a welcome-back greeting: their
// profile display name if they've upgraded to the web app, otherwise
// their WhatsApp display name (backfilled onto the profile so future
// turns don't need it re-supplied), otherwise null for a first-time
// greeting.
async function greetingName(phone: string, waName?: string | null): Promise<string | null> {
  const profile = await db.getOrCreateProfile(phone, waName);
  return profile.displayName || waName || null;
}

// If the buyer already has a paused flow, don't silently blow it away by
// starting a new one — stash the new flow's result and ask them to choose.
// Otherwise applies the result immediately, same as before.
async function maybeGatePaused(phone: string, result: FlowResult): Promise<BotReply> {
  if (result.nextState && (await hasPausedSession(phone))) {
    await setState(phone, 'PAUSED_CHOICE', {
      pendingStart: { nextState: result.nextState, contextPatch: result.contextPatch, reply: result.reply ?? null },
    });
    return { reply: PAUSED_CHOICE_PROMPT };
  }
  return apply(phone, result);
}

async function handlePausedChoice(
  phone: string,
  trimmed: string,
  context: ConversationContext
): Promise<BotReply> {
  const choice = trimmed.toLowerCase();

  if (choice === '1' || choice === 'resume') {
    const resumed = await resumeSession(phone);
    if (!resumed) {
      await setState(phone, 'MAIN_MENU', {});
      return { reply: mainMenu.showMainMenu(false) };
    }
    return { reply: `Picking up where you left off.\n\n${resumed.lastPrompt || mainMenu.showMainMenu(false)}` };
  }

  if (choice === '2' || choice === 'new' || choice === 'start new') {
    await clearPaused(phone);
    const pendingStart = context.pendingStart;

    if (!pendingStart) {
      await setState(phone, 'MAIN_MENU', {});
      return { reply: mainMenu.showMainMenu(false) };
    }
    return apply(phone, { nextState: pendingStart.nextState, contextPatch: pendingStart.contextPatch, reply: pendingStart.reply });
  }

  return { reply: `Please reply with 1 to resume your paused booking, or 2 to start a new one.` };
}

// Applies a flow's result to session state and stores its reply as the
// "lastPrompt" so PAUSE -> RESUME can redisplay exactly this question.
async function apply(phone: string, result: FlowResult): Promise<BotReply> {
  if (!result) return { reply: FALLBACK() };
  if (result.nextState) {
    await setState(phone, result.nextState, result.contextPatch || {}, result.reply ?? undefined);
  }
  return { reply: result.reply ?? null, followUp: result.followUp, cta: result.cta };
}

// A hotel accepts/declines a paid booking by replying "CONFIRM <ref>" or
// "DECLINE <ref>" from the number registered on their `hotelPartners` row.
// Returns null (falls through to the normal buyer flow) unless the sender
// is a recognized hotel WhatsApp number sending one of these commands.
async function tryHandleHotelReply(phone: string, trimmed: string): Promise<BotReply | null> {
  const upper = trimmed.toUpperCase();
  if (!upper.startsWith('CONFIRM ') && !upper.startsWith('DECLINE ')) return null;

  const hotel = await db.findHotelByWhatsappNumber(phone);
  if (!hotel) return null; // not a recognized hotel number — treat as a normal buyer message

  const [action, reference] = trimmed.split(/\s+/);
  if (!reference) {
    return { reply: `Please include the booking reference, e.g. CONFIRM OX-HTL-XXXXXX` };
  }

  const order = await db.findHotelOrderByReference(reference.toUpperCase());
  if (!order || order.hotelId !== hotel.id) {
    return { reply: `No booking found for reference "${reference}".` };
  }

  if (order.status !== 'paid') {
    return { reply: `Booking ${reference} is no longer awaiting your response (status: ${order.status}).` };
  }

  if (action.toUpperCase() === 'CONFIRM') {
    const updated = await db.confirmHotelOrder(order.id);
    await hotelFlow.deliverConfirmedHotelOrder(updated);
    return { reply: `Booking ${reference} confirmed. The guest has been notified.` };
  }

  const updated = await db.declineHotelOrder(order.id);
  await hotelFlow.notifyGuestOfDecline(updated);
  return { reply: `Booking ${reference} declined. The guest has been notified.` };
}
