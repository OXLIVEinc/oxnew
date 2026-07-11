import QRCode from "qrcode";

export async function generateQr(
  token: string
): Promise<Buffer> {
  return QRCode.toBuffer(token, {
    type: "png",
    width: 500,
    margin: 2,
  });
}