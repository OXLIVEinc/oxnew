import { FlowResult,ConversationContext } from '../../types';
import { sendSupportEmail } from '../../services/supportEmail';

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
    nextState: "SUPPORT_MESSAGE",
    contextPatch: {
        supportCategory: category,
    },
    reply:
        `Please describe your issue in as much detail as possible.\n\n` +
        `Helpful information includes:\n` +
        `• Booking or order reference\n` +
        `• Event or hotel name\n` +
        `• What happened\n` +
        `• What you expected`,
};
}


export async function handleSupportMessage(
    message: string,
): Promise<FlowResult> {
    return {
        nextState: "SUPPORT_ATTACHMENTS",
        contextPatch: {
            supportMessage: message,
        },
        reply:
            `Would you like to attach any screenshots or photos to help explain the issue?\n\n` +
            `1. Yes\n` +
            `2. No`,
    };
}

export async function handleAttachmentChoice(
  input: string,
  phone: string,
  waName: string | null | undefined,
  context: ConversationContext,
): Promise<FlowResult> {
  const choice = input.trim().toLowerCase();

  if (choice === '1' || choice === 'yes') {
    return {
      nextState: 'SUPPORT_ATTACHMENT_UPLOAD',
      reply:
        `Please send your screenshots or photos one at a time.\n\n` +
        `You can attach up to 5 images.\n\n` +
        `When you're finished, reply DONE to submit your support request.`,
    };
  }

  if (choice === '2' || choice === 'no') {
    return submitSupportRequest(
      phone,
      waName,
      context,
    );
  }

  return {
    reply:
      `Please reply with one of the following:\n\n` +
      `1. Yes\n` +
      `2. No`,
  };
}



export async function handleAttachmentUpload(
  context: ConversationContext,
  image: {
    id: string;
    filename: string;
    mimeType: string;
  },
): Promise<FlowResult> {
  const images = [...(context.supportImages ?? [])];

  if (images.length >= 5) {
    return {
      reply:
        `You've already attached the maximum of 5 images.\n\n` +
        `Reply DONE to submit your support request.`,
    };
  }

  images.push(image);

  return {
    nextState: 'SUPPORT_ATTACHMENT_UPLOAD',
    contextPatch: {
      supportImages: images,
    },
    reply:
      `✅ Screenshot received (${images.length}/5).\n\n` +
      `Send another image or reply DONE when you're finished.`,
  };
}



export async function submitSupportRequest(
  phone: string,
  waName: string | null | undefined,
  context: ConversationContext,
): Promise<FlowResult> {
  try {
    await sendSupportEmail({
      name: waName,
      phone,
      category: context.supportCategory ?? 'General',
      message: context.supportMessage ?? '',
      images: context.supportImages ?? [],
    });

    return {
      nextState: 'MAIN_MENU',
      contextPatch: {
        supportCategory: undefined,
        supportMessage: undefined,
        supportImages: undefined,
      },
      reply:
        `Thank you! Your support request has been sent successfully.\n\n` +
        `Our support team will get back to you as soon as possible.`,
    };
  } catch (error) {
    console.error(error);

    return {
      nextState: 'SUPPORT_ATTACHMENT_UPLOAD',
      reply:
        `Sorry, we couldn't submit your support request.\n\n` +
        `Reply DONE to try again.`,
    };
  }
}