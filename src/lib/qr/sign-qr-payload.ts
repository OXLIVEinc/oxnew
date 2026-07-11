import jwt from "jsonwebtoken";

const QR_SECRET = process.env.QR_SECRET!;

if (!QR_SECRET) {
  throw new Error("QR_SECRET is missing.");
}

export interface QrPayload {
  ticketId: string;
  eventId: string;
  buyerName: string;
  ticketTier: string;
  checkInCode: string;
}

export function signQrPayload(payload: QrPayload): string {
  return jwt.sign(payload, QR_SECRET, {
    algorithm: "HS256",
  });
}