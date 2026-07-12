/**
 * Some events need to push a WhatsApp message to someone who isn't the
 * person currently mid-conversation with the router — e.g. notifying a
 * transfer recipient, or delivering tickets once a Paystack webhook fires,
 * or a delayed queue job (hotel upsell, referral, pre-event reminder).
 * server.ts wires these up to the real WhatsApp Cloud API calls at startup;
 * until then they just log, which is exactly what you want for `npm run simulate`.
 */
import { CtaUrlPayload } from '../types';

type TextSender = (phone: string, message: string) => void | Promise<void>;
type ImageSender = (phone: string, imageUrl: string, caption?: string) => void | Promise<void>;
type CtaUrlSender = (phone: string, cta: CtaUrlPayload) => void | Promise<void>;

export interface ReplyButtonsPayload {
  bodyText: string;
  footerText?: string;
  buttons: {
    id: string;
    title: string;
  }[];
}

let textSender: TextSender = (phone, message) => {
  console.log(`--> WhatsApp text to ${phone}:\n${message}\n`);
};

let imageSender: ImageSender = (phone, imageUrl, caption) => {
  console.log(`--> WhatsApp image to ${phone}: ${imageUrl}${caption ? `\ncaption: ${caption}` : ""}\n`);
};

let ctaUrlSender: CtaUrlSender = (phone, cta) => {
  console.log(
    `--> WhatsApp CTA button to ${phone}: [${cta.buttonText}] ${cta.url}${
      cta.footerText ? `\nfooter: ${cta.footerText}` : ""
    }\n`
  );
};

export function setMessenger(fn: TextSender): void {
  textSender = fn;
}

export function setImageMessenger(fn: ImageSender): void {
  imageSender = fn;
}

export function setCtaUrlMessenger(fn: CtaUrlSender): void {
  ctaUrlSender = fn;
}

export async function sendMessage(phone: string, message: string): Promise<void> {
  await textSender(phone, message);
}

export async function sendImageMessage(phone: string, imageUrl: string, caption?: string): Promise<void> {
  await imageSender(phone, imageUrl, caption);
}

/** Sends a proper clickable button instead of a bare link pasted into text. */
export async function sendCtaUrlMessage(phone: string, cta: CtaUrlPayload): Promise<void> {
  await ctaUrlSender(phone, cta);
}



type ReplyButtonsSender = (
  phone: string,
  payload: ReplyButtonsPayload
) => void | Promise<void>;

let replyButtonsSender: ReplyButtonsSender = (phone, payload) => {
  console.log(
    `--> WhatsApp Reply Buttons to ${phone}\n`,
    JSON.stringify(payload, null, 2)
  );
};

export function setReplyButtonsMessenger(fn: ReplyButtonsSender): void {
  replyButtonsSender = fn;
}

export async function sendReplyButtonsMessage(
  phone: string,
  payload: ReplyButtonsPayload
): Promise<void> {
  await replyButtonsSender(phone, payload);
}