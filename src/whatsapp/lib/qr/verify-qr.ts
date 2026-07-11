import jwt from "jsonwebtoken";
import { QrPayload } from "./sign-qr-payload";

function getSecret(): string {
  const secret = process.env.QR_SECRET;
  if (!secret) {
    throw new Error("QR_SECRET is missing — set it in .env before verifying ticket QR codes.");
  }
  return secret;
}

export function verifyQrPayload(token: string): QrPayload {
  return jwt.verify(token, getSecret()) as QrPayload;
}
