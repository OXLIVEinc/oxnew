
import React from "react";
import { resend } from "../lib/resend";

interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({
  to,
  subject,
  react,
}: SendEmailOptions) {
  return resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to,
    subject,
    react,
  });
}