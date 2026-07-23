import jwt from "jsonwebtoken";

export interface QrPayload {
  ticketId: string;
  eventId: string;
  attendeeName: string;
  ticketTier: string;
  checkInCode: string;
}

function getSecret(): string {
  const secret = process.env.QR_SECRET;
  if (!secret) {
    throw new Error("QR_SECRET is missing — set it in .env before generating ticket QR codes.");
  }
  return secret;
}

export function signQrPayload(payload: QrPayload): string {
  return jwt.sign(payload, getSecret(), { algorithm: "HS256" });
}
