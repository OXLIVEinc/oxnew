import * as db from '../../data/db';
import { naira, asNumberChoice, isMoreCommand, FALLBACK, formatEventDateTime } from '../helpers';
import { ConversationContext, EventSearchResultItem, FlowResult } from '../../types';

const CHECKOUT_BASE_URL = process.env.CHECKOUT_BASE_URL || 'https://ox.app';

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

export async function enterViaDeepLink(event: db.EventRow): Promise<FlowResult> {
  let tiers = await db.getTiersForEvent(event.id);
  if (tiers.length === 0) {
    // Every event must have at least one tier — fall back to General
    // Admission if the organizer/admin never created one.
    tiers = [await db.ensureDefaultTicketTier(event.id)];
  }
  // Buyers should never be offered a sold-out tier.
  const availableTiers = tiers.filter((t) => !db.isTierSoldOut(t));

  return {
    nextState: 'EVENT_SELECT_TIER',
    contextPatch: {
      eventId: event.id,
      eventCode: event.eventCode,
      eventName: event.title,
      eventDateLabel: formatEventDateTime(event.startsAt, event.endsAt),
      eventAddress: event.address,
      eventBackgroundImageUrl: event.backgroundImageUrl,
      maxPerOrder: event.maxPerOrder,
      tierOptions: availableTiers.map((t) => ({ id: t.id, label: t.name, price: Number(t.price) })),
    },
    reply: renderEventCard(event, availableTiers),
  };
}

/** First message after picking "Browse events" from the main menu. */
export async function handleBrowseInput(text: string): Promise<FlowResult> {
  const trimmed = text.trim();

  const byCode = await db.findEventByCode(trimmed);
  if (byCode) return enterViaDeepLink(byCode);

  if (trimmed.toUpperCase() === 'ALL') {
    return renderEventsPage(await db.listUpcomingEvents(0), '');
  }

  return renderEventsPage(await db.searchEvents(trimmed, 0), trimmed);
}

/** Subsequent input while a result list is on screen: a number, or MORE. */
export async function handleBrowseResultsInput(text: string, context: ConversationContext): Promise<FlowResult> {
  if (isMoreCommand(text)) {
    const offset = context.browseOffset ?? 0;
    const query = context.browseQuery ?? '';
    const page = query ? await db.searchEvents(query, offset) : await db.listUpcomingEvents(offset);
    return renderEventsPage(page, query, true);
  }

  const matches = context.searchResults || [];
  const choice = asNumberChoice(text, 1, matches.length);
  if (choice === null) return { reply: FALLBACK() };

  const event = await db.getEventById(matches[choice - 1].id);
  if (!event) return { reply: FALLBACK() };
  return enterViaDeepLink(event);
}

async function renderEventsPage(
  page: db.Page<db.EventRow>,
  query: string,
  isMorePage = false
): Promise<FlowResult> {
  if (page.items.length === 0 && !isMorePage) {
    return {
      reply: query
        ? `We couldn't find any upcoming events matching "${query}".\n\nTry another search term, paste an event code, or type MENU to go back.`
        : `There are no upcoming events right now. Type MENU to go back.`,
    };
  }
  if (page.items.length === 0 && isMorePage) {
    return { reply: `That's everything. Type MENU for more options.` };
  }
  if (page.items.length === 1 && !isMorePage && query) {
    return enterViaDeepLink(page.items[0]);
  }

  const results: EventSearchResultItem[] = page.items.map((e) => ({
    id: e.id,
    eventCode: e.eventCode,
    name: e.title,
    dateLabel: formatEventDateTime(e.startsAt, e.endsAt),
  }));

  const list = results.map((e, i) => `${i + 1}. ${e.name} - ${e.dateLabel}`).join('\n');
  const more = page.hasMore ? `\n\nReply MORE to see more events.` : '';

  return {
    nextState: 'BROWSE_RESULTS',
    contextPatch: {
      searchResults: results,
      browseQuery: query,
      browseOffset: page.nextOffset,
    },
    reply: `Here's what we found:\n\n${list}${more}\n\nReply with a number to view details.`,
  };
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function renderEventCard(event: db.EventRow, tiers: { name: string; price: string | number }[]): string {
  if (tiers.length === 0) {
    return (
      `You're here for:\n\n` +
      `${event.title.toUpperCase()}\n` +
      `${formatEventDateTime(event.startsAt, event.endsAt)}\n` +
      `${event.address}\n\n` +
      `All ticket tiers for this event are sold out right now. Type MENU to browse other events.`
    );
  }

  const tierLines = tiers
    .map((t, i) => `${i + 1}. ${t.name} - ${naira(Number(t.price))}`)
    .join('\n');

  return (
    `You're here for:\n\n` +
    `${event.title.toUpperCase()}\n` +
    `${formatEventDateTime(event.startsAt, event.endsAt)}\n` +
    `${event.address}\n\n` +
    `Select your ticket:\n\n` +
    `${tierLines}\n\n` +
    `Reply with the number of your choice.`
  );
}

// ---------------------------------------------------------------------------
// tier -> quantity
// ---------------------------------------------------------------------------

export async function handleTierSelection(text: string, context: ConversationContext): Promise<FlowResult> {
  const tierOptions = context.tierOptions || [];
  const choice = asNumberChoice(text, 1, tierOptions.length);
  if (choice === null) return { reply: FALLBACK() };

  const tier = tierOptions[choice - 1];
  const maxQty = Math.min(context.maxPerOrder || 10, 4);
  const qtyOptions = Array.from({ length: maxQty }, (_, i) => i + 1)
    .map((n) => `${n}. ${n} ticket${n > 1 ? 's' : ''}`)
    .join('\n');

  return {
    nextState: 'EVENT_QTY',
    contextPatch: { tierId: tier.id, tierLabel: tier.label, tierPrice: tier.price },
    reply:
      `Great - ${tier.label} at ${naira(tier.price)} per ticket.\n\n` +
      `How many tickets do you need? (Up to ${context.maxPerOrder || 10} per purchase)\n\n` +
      `${qtyOptions}`,
  };
}

// ---------------------------------------------------------------------------
// quantity -> create ticket order -> hand off checkout link
// (No attendee-name step here — that happens in the checkout view, one
// name + email per seat, right before payment. Free events, isPaid=false,
// go through this exact same order pipeline with amount 0 — the checkout
// view/frontend is responsible for skipping the payment redirect.)
// ---------------------------------------------------------------------------

export async function handleQtyInput(text: string, context: ConversationContext, phone: string): Promise<FlowResult> {
  const qty = asNumberChoice(text, 1, context.maxPerOrder || 10);
  if (qty === null) return { reply: FALLBACK() };

  let order;
  try {
    order = await db.createTicketOrder({
      phone,
      eventId: context.eventId!,
      tierId: context.tierId!,
      quantity: qty,
      unitPrice: context.tierPrice!,
    });
  } catch (err) {
    if (err instanceof db.TierUnavailableError) {
      return { reply: `${err.message} Type MENU to see other options.` };
    }
    throw err;
  }

  const checkoutLink = `${CHECKOUT_BASE_URL}/checkout/${order.id}`;

  return {
    nextState: 'EVENT_CHECKOUT_PENDING',
    contextPatch: { qty, orderId: order.id, orderReference: order.reference, checkoutLink },
    reply:
      `${qty} ticket${qty > 1 ? 's' : ''} of ${context.tierLabel} for ${context.eventName}.\n\n` +
      `Tap below to enter each guest's name and email, then pay securely. This link expires in 30 minutes.\n\n` +
      `Once payment is confirmed, your tickets will arrive right here in this chat automatically - no need to do anything else.`,
    cta: {
      footerText: 'Expires in 30 minutes',
      buttonText: 'Complete Checkout',
      url: checkoutLink,
    },
  };
}
