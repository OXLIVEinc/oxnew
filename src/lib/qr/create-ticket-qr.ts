import { generateCheckInCode } from "../../modules/whatsapp/lib/ids";
import { signQrPayload } from "./sign-qr-payload";
import { generateQr } from "./generate-qr";
import { uploadQr } from "./upload-qr";
import { createTicketCard } from "./create-ticket-card";


interface CreateTicketQrParams {
  ticketId: string;
  eventId: string;
  attendeeName: string;
  ticketTier: string;
  eventName: string;
  eventStartsAt: Date | string;
  eventEndsAt?: Date | string | null;
  address: string;
  brand?: string;
  banner?: string;
}

/**
 * Builds everything needed for one ticket's delivery: a fresh check-in
 * code, a signed JWT payload embedded in the QR image, a branded ticket
 * card (QR + event details), and the public URL it was uploaded to.
 */
export async function createTicketQr({
  ticketId,
  eventId,
  attendeeName,
  ticketTier,
  eventName,
  eventStartsAt,
  eventEndsAt,
  address,
  brand,
  banner,
}: CreateTicketQrParams): Promise<{ checkInCode: string; qrCode: string }> {
  const checkInCode = generateCheckInCode();

  const token = signQrPayload({
    ticketId,
    eventId,
    attendeeName,
    ticketTier,
    checkInCode,
  });

  const qrBuffer = await generateQr(token);

  const ticketBuffer = await createTicketCard({
    eventName,
    eventStartsAt,
    eventEndsAt,
    address,
    guest: attendeeName,
    tier: ticketTier,
    qrBuffer,
    brand,
    banner,
  });

  const qrCode = await uploadQr(ticketBuffer);

  return { checkInCode, qrCode };
}
