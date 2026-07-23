import { generateCheckInCode } from "@/utils/helpers";
import { signQrPayload } from "./sign-qr-payload";
import { generateQr } from "./generate-qr";
import { uploadQr } from "./upload-qr";
import { createTicketCard } from "./create-ticket-card";

type Params = {
  ticketId: string;
  eventId: string;

  buyerName: string;
  ticketTier: string;

  eventName: string;
  eventDate: string;
  venue: string;
  brand?:string;
  banner?:string,
};

export async function createTicketQr({
  ticketId,
  eventId,
  buyerName,
  ticketTier,
  eventName,
  eventDate,
  venue,
  brand,
  banner,
}: Params) {
  const checkInCode = generateCheckInCode();

  const token = signQrPayload({
    ticketId,
    eventId,
    buyerName,
    ticketTier,
    checkInCode,
  });

  const qrBuffer = await generateQr(token);

  // Build the beautiful ticket image
  const ticketBuffer = await createTicketCard({
  eventName,
  eventDate,
  venue,
  guest: buyerName,
  tier: ticketTier,
  qrBuffer,
  brand,
  banner
});

  // Upload the ticket image instead of the raw QR
  const qrCode = await uploadQr(ticketBuffer);

  return {
    checkInCode,
    qrCode,
  };
}