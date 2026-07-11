import crypto from "crypto";
import { supabaseAdmin } from "../../../supabase/admin";

export async function uploadQr(
  qrBuffer: Buffer
) {
  const filename = `${crypto.randomUUID()}.png`;

  const path = `tickets/${filename}`;

  const { error } =
    await supabaseAdmin.storage
      .from("qr-codes")
      .upload(path, qrBuffer, {
        contentType: "image/png",
        upsert: false,
      });

  if (error) {
    throw error;
  }

  const { data } =
    supabaseAdmin.storage
      .from("qr-codes")
      .getPublicUrl(path);

  return data.publicUrl;
}