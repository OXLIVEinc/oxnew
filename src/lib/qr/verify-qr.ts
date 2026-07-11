import jwt from "jsonwebtoken";
import { QrPayload } from "./sign-qr-payload";

const QR_SECRET = process.env.QR_SECRET!;

export function verifyQrPayload(token: string): QrPayload {
  return jwt.verify(token, QR_SECRET) as QrPayload;
}