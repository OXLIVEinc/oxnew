import React from 'react';
import { resend } from '../lib/resend';
import { SupportRequestEmail } from '../emails/supportRequestEmail';
import { SupportEmailInput } from '../types';

export async function sendSupportEmail({
  name,
  phone,
  category,
  message,
}: SupportEmailInput) {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: process.env.SUPPORT_EMAIL!,
    subject: `[Support] ${category} - ${phone}`,
    react: React.createElement(SupportRequestEmail, {
      name,
      phone,
      category,
      message,
    }),
  });
}

