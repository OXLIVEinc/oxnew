import { FlowResult } from '../../types';
import { asNumberChoice, FALLBACK } from '../helpers';

/**
 * @param hasPaused - whether the buyer has a paused flow waiting on RESUME
 * @param name      - the buyer's profile display name, falling back to
 *                    their WhatsApp name when they haven't set one up on
 *                    the web yet. Omitted for a first-time greeting.
 */
export function showMainMenu(hasPaused: boolean = false, name?: string | null): string {
  const greeting = name ? `Welcome back, ${name}.` : `Welcome to OX.`;
  const resumeLine = hasPaused ? `You have a paused booking. Type RESUME to pick up where you left off.\n\n` : '';
  return (
    `${greeting}\n\n` +
    resumeLine +
    `What would you like to do today?\n\n` +
    `1. Browse events\n` +
    `2. Book a hotel\n` +
    `3. Transfer a ticket\n` +
    `4. My bookings (tickets & hotels)\n` +
    `5. Contact support\n\n` +
    `Reply with a number 1-5.`
  );
}

export function handleMainMenuInput(text: string): FlowResult {
  const choice = asNumberChoice(text, 1, 5);
  if (choice === null) {
    return { reply: FALLBACK() };
  }

  switch (choice) {
    case 1:
      return {
        nextState: 'BROWSE_EVENTS',
        reply:
          `Please enter a search term (e.g. "Afrobeats" or "Comedy"), or type ALL to see all upcoming events.\n\n` +
          `Type MENU to go back.`
      };
    case 2:
      return {
        nextState: 'HOTEL_SEARCH',
        reply: `Which city are you booking in? (e.g. Lagos, Abuja)`,
      };
    case 3:
      return { nextState: 'TRANSFER_INIT' };
    case 4:
      return {
        nextState: 'BOOKING_KIND_SELECT',
        reply: showBookingKindPrompt(),
      };
    case 5:
      return { nextState: 'HELP' };
    default:
      return { reply: FALLBACK() };
  }
}

export function showBookingKindPrompt(): string {
  return (
    `What would you like to see?\n\n` +
    `1. Ticket orders\n` +
    `2. Hotel bookings\n` +
    `3. Both\n\n` +
    `Reply with a number 1-3.`
  );
}

export function handleBookingKindInput(text: string): FlowResult {
  const choice = asNumberChoice(text, 1, 3);
  if (choice === null) return { reply: FALLBACK() };

  const bookingKind = choice === 1 ? 'tickets' : choice === 2 ? 'hotel' : 'both';
  return {
    nextState: 'CHECK_BOOKINGS',
    contextPatch: { bookingKind, ordersOffset: 0 },
  };
}
