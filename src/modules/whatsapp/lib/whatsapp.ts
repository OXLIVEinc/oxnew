/**
 * Thin client around Meta's WhatsApp Cloud API
 * (https://developers.facebook.com/docs/whatsapp/cloud-api). Two calls are
 * all the bot needs:
 *   - sendCloudTextMessage: plain text, inside the 24hr customer service
 *     window
 *   - sendCloudImageByUrl: an image (or any file) by public URL, with an
 *     optional caption — this is how ticket QR images get delivered.
 *
 * Both throw on non-2xx so callers (queues/workers) can retry/log properly
 * instead of silently swallowing delivery failures.
 */

const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || "v21.0";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

function assertConfigured(): { phoneNumberId: string; token: string } {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_TOKEN) {
    throw new Error(
      "WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_TOKEN are not set — configure them in .env to send real WhatsApp messages."
    );
  }
  return { phoneNumberId: WHATSAPP_PHONE_NUMBER_ID, token: WHATSAPP_TOKEN };
}

/** Cloud API expects bare digits, no leading +. Strip one if it was passed in. */
function normalizePhone(phone: string): string {
  return phone.replace(/^\+/, "");
}

async function cloudApiFetch(body: Record<string, unknown>): Promise<any> {
  const { phoneNumberId, token } = assertConfigured();

  const res = await fetch(
    `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...body }),
    }
  );

  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    console.error("WhatsApp API Error:", res.status, text);

    throw new Error(
      `WhatsApp Cloud API request failed: ${res.status} ${text}`
    );
  }

  return data;
}

/** Plain text message to a phone already inside an active 24hr session. */
export async function sendCloudTextMessage(phone: string, message: string): Promise<void> {
  await cloudApiFetch({
    to: normalizePhone(phone),
    type: "text",
    text: { body: message, preview_url: false },
  });
}

/** Sends an image by public URL, with an optional caption. */
export async function sendCloudImageByUrl(
  phone: string,
  imageUrl: string,
  caption?: string
): Promise<void> {
  await cloudApiFetch({
    to: normalizePhone(phone),
    type: "image",
    image: { link: imageUrl, ...(caption ? { caption } : {}) },
  });
}

/**
 * Sends an interactive "cta_url" message — a proper clickable button that
 * opens `url` in the browser, instead of a bare link pasted into text.
 * Used for ticket checkout, hotel order review, and transfer claim links.
 */export async function sendCloudCtaUrlMessage(
  phone: string,
  options: {
    bodyText?: string;
    footerText?: string;
    buttonText: string;
    url: string;
  }
): Promise<void> {
  await cloudApiFetch({
    to: normalizePhone(phone),
    type: "interactive",
    interactive: {
      type: "cta_url",

      body: {
        text:
          options.bodyText ??
          "Tap the button below to continue.",
      },

      ...(options.footerText
        ? {
            footer: {
              text: options.footerText,
            },
          }
        : {}),

      action: {
        name: "cta_url",
        parameters: {
          display_text: options.buttonText,
          url: options.url,
        },
      },
    },
  });
}


export async function markAsReadAndShowTyping(
  whatsappMessageId: string
): Promise<void> {
  await cloudApiFetch({
    status: "read",
    message_id: whatsappMessageId,
    typing_indicator: {
      type: "text",
    },
  });
}


export async function sendCloudReplyButtonsMessage(
  phone: string,
  options: {
    bodyText: string;
    footerText?: string;
    buttons: {
      id: string;
      title: string;
    }[];
  }
): Promise<void> {
  console.log('called', options,normalizePhone(phone))
  await cloudApiFetch({
    to: normalizePhone(phone),
    type: "interactive",
    interactive: {
      type: "button",

      body: {
        text: options.bodyText,
      },

      ...(options.footerText
        ? {
            footer: {
              text: options.footerText,
            },
          }
        : {}),

      action: {
        buttons: options.buttons.map((button) => ({
          type: "reply",
          reply: {
            id: button.id,
            title: button.title,
          },
        })),
      },
    },
  });
}