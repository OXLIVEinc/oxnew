import { FlowResult, ConversationContext } from '../../types';

const SUPPORT_CATEGORIES = {
  '1': 'Event Tickets',
  '2': 'Hotel Booking',
  '3': 'Ticket Transfer',
  '4': 'Payments & Refunds',
  '5': 'Account',
  '6': 'Something Else',
} as const;

export function startSupport(): FlowResult {
  return {
    nextState: 'SUPPORT_CATEGORY',
    reply:
      `We're here to help.\n\n` +
      `What do you need help with?\n\n` +
      `1. Event Tickets\n` +
      `2. Hotel Booking\n` +
      `3. Ticket Transfer\n` +
      `4. Payments & Refunds\n` +
      `5. Account\n` +
      `6. Something Else\n\n` +
      `Reply with a number (1-6).`,
  };
}

export async function handleCategorySelection(
  input: string,
): Promise<FlowResult> {
  const category = SUPPORT_CATEGORIES[input as keyof typeof SUPPORT_CATEGORIES];

  if (!category) {
    return {
      reply:
        `Please choose one of the options below:\n\n` +
        `1. Event Tickets\n` +
        `2. Hotel Booking\n` +
        `3. Ticket Transfer\n` +
        `4. Payments & Refunds\n` +
        `5. Account\n` +
        `6. Something Else`,
    };
  }

  return {
    nextState: 'SUPPORT_MESSAGE',
    contextPatch: {
      supportCategory: category,
    },
    reply:
      `Please describe your issue in as much detail as possible.\n\n` +
      `Helpful information includes:\n` +
      `• Booking or order reference\n` +
      `• Event or hotel name\n` +
      `• What happened\n` +
      `• What you expected\n\n` +
      `Once you send your message, it will be forwarded to our support team.`,
  };
}