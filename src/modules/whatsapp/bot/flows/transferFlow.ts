import * as db from '../../data/db';
import { asNumberChoice, FALLBACK } from '../helpers';
import { ConversationContext, FlowResult } from '../../types';
import { sendMessage, sendCtaUrlMessage } from '../messenger';

const CHECKOUT_BASE_URL = process.env.CHECKOUT_BASE_URL || 'https://ox.app';

export async function initTransfer(phone: string): Promise<FlowResult> {
  const transferable = await db.getTransferableTicketsWithDetails(phone);

  if (transferable.length === 0) {
    return {
      nextState: 'MAIN_MENU',
      reply: `You don't have any active tickets to transfer right now.\n\n` + `Type MENU to go back.`,
    };
  }

  const list = transferable
    .map((t, i) => `${i + 1}. ${t.eventName} - ${t.tierLabel} (Ref: ${t.checkInCode})`)
    .join('\n');

  return {
    nextState: 'TRANSFER_SELECT_TICKET',
    contextPatch: {
      transferable: transferable.map((t) => ({
        id: t.id,
        ref: t.checkInCode,
        eventName: t.eventName,
        tierLabel: t.tierLabel,
      })),
    },
    reply: `Which ticket would you like to transfer?\n\n${list}`,
  };
}

export async function handleTicketSelection(text: string, context: ConversationContext): Promise<FlowResult> {
  const transferable = context.transferable || [];
  const choice = asNumberChoice(text, 1, transferable.length);
  if (choice === null) return { reply: FALLBACK() };

  const ticket = transferable[choice - 1];
  return {
    nextState: 'TRANSFER_RECIPIENT_PHONE',
    contextPatch: {
      ticketId: ticket.id,
      ticketRef: ticket.ref,
      ticketEventName: ticket.eventName,
      ticketTierLabel: ticket.tierLabel,
    },
    reply:
      `Got it - ${ticket.eventName} (${ticket.tierLabel}).\n\n` +
      `What's the recipient's WhatsApp number, including country code (e.g. 2348123456789)?`,
  };
}

export async function handleRecipientPhone(text: string, context: ConversationContext): Promise<FlowResult> {
  const phone = text.trim().replace(/\D/g, '');
  if (phone.length < 10) {
    return {
      reply: `That doesn't look like a valid phone number. Please try again, including country code.`,
    };
  }

  return {
    nextState: 'TRANSFER_CONFIRM',
    contextPatch: { recipientPhone: phone },
    reply:
      `Please confirm:\n\n` +
      `${context.ticketEventName} - ${context.ticketTierLabel}\n` +
      `Ref: ${context.ticketRef}\n` +
      `Sending to: ${phone}\n\n` +
      `They'll get a WhatsApp message with a link to confirm and claim it using their own name and email - nothing is transferred until they do.\n\n` +
      `1. Yes - send it\n` +
      `2. No - cancel`,
  };
}

export async function handleConfirm(text: string, context: ConversationContext, phone: string): Promise<FlowResult> {
  const choice = asNumberChoice(text, 1, 2);
  if (choice === null) return { reply: FALLBACK() };

  if (choice === 2) {
    return { nextState: 'MAIN_MENU', reply: `No problem, transfer cancelled. Type MENU for options.` };
  }

  const transfer = await db.createTicketTransfer({
    ticketId: context.ticketId!,
    fromPhone: phone,
    toPhone: context.recipientPhone!,
  });

  const claimLink = `${CHECKOUT_BASE_URL}/transfer/claim/${transfer.transferCode}`;

  await sendMessage(
    context.recipientPhone!,
    `Someone sent you a ticket for ${context.ticketEventName} (${context.ticketTierLabel}).\n\n` +
      `Tap below to claim it - you'll just need to enter your full name and email. This link expires in 24 hours.`
  );
  await sendCtaUrlMessage(context.recipientPhone!, {
    footerText: 'Expires in 24 hours',
    buttonText: 'Claim Ticket',
    url: claimLink,
  });

  return {
    nextState: 'MAIN_MENU',
    reply:
      `Transfer sent. We've messaged ${context.recipientPhone} with a link to claim it.\n\n` +
      `You'll get a notification here as soon as they confirm. Type MENU for more options.`,
  };
}
