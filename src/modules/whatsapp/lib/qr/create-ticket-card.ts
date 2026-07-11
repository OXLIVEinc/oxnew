import sharp, { OverlayOptions } from "sharp";
import { formatEventDate, formatEventTimeRange } from "../datetime";

interface TicketCardOptions {
  eventName: string;
  eventStartsAt: Date | string;
  eventEndsAt?: Date | string | null;
  address: string;
  guest: string;
  tier: string;
  qrBuffer: Buffer;
  brand?: string;
  banner?: string; // URL of the event's background image, used as a header strip
}

const CARD_WIDTH = 800;
const CARD_HEIGHT = 1200;
const BANNER_HEIGHT = 200;

const COLORS = {
  background: "#ffffff",
  bannerBg: "#eaeaea",
  boxBg: "#f5f5f5",
  textPrimary: "#111111",
  textSecondary: "#555555",
  textMuted: "#888888",
} as const;

export async function createTicketCard({
  eventName,
  eventStartsAt,
  eventEndsAt,
  address,
  guest,
  tier,
  qrBuffer,
  brand = "OX",
  banner,
}: TicketCardOptions): Promise<Buffer> {
  // -----------------------------
  // Load banner (best-effort — never break ticket generation over it)
  // -----------------------------
  let bannerBuffer: Buffer | null = null;

  if (banner) {
    try {
      const response = await fetch(banner);
      if (response.ok) {
        bannerBuffer = Buffer.from(await response.arrayBuffer());
      }
    } catch (error) {
      console.error("[create-ticket-card] failed to load banner image:", error);
    }
  }

  const dateLine = formatEventDate(eventStartsAt);
  const timeLine = formatEventTimeRange(eventStartsAt, eventEndsAt);

  // -----------------------------
  // SVG Layout
  // -----------------------------
  const svg = `
    <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .title { font-family: Arial, sans-serif; font-size: 42px; font-weight: 700; fill: ${COLORS.textPrimary}; }
          .subtitle { font-family: Arial, sans-serif; font-size: 24px; fill: ${COLORS.textSecondary}; }
          .label { font-family: Arial, sans-serif; font-size: 18px; font-weight: 500; letter-spacing: 1.5px; fill: ${COLORS.textMuted}; }
          .value { font-family: Arial, sans-serif; font-size: 28px; font-weight: 600; fill: ${COLORS.textPrimary}; }
        </style>
      </defs>

      <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="32" fill="${COLORS.background}" />
      <rect x="0" y="0" width="${CARD_WIDTH}" height="${BANNER_HEIGHT}" fill="${COLORS.bannerBg}" />

      <text x="48" y="270" class="label">TICKET</text>
      <text x="48" y="330" class="title">${escapeXml(eventName)}</text>
      <text x="48" y="380" class="subtitle">${escapeXml(dateLine)}</text>
      <text x="48" y="415" class="subtitle">${escapeXml(timeLine)} • ${escapeXml(address)}</text>

      <rect x="40" y="490" width="720" height="125" rx="20" fill="${COLORS.boxBg}" />
      <text x="60" y="535" class="label">GUEST</text>
      <text x="60" y="585" class="value">${escapeXml(guest)}</text>

      <rect x="40" y="645" width="720" height="125" rx="20" fill="${COLORS.boxBg}" />
      <text x="60" y="690" class="label">TICKET TYPE</text>
      <text x="60" y="740" class="value">${escapeXml(tier)}</text>

      <text x="50%" y="975" text-anchor="middle" class="label">Scan QR Code for Entry</text>
      <text x="50%" y="1145" text-anchor="middle" class="subtitle">Powered by ${escapeXml(brand)}</text>
    </svg>
  `;

  const composites: OverlayOptions[] = [];

  composites.push({
    input: await sharp(qrBuffer).resize(260, 260).png().toBuffer(),
    left: Math.floor((CARD_WIDTH - 260) / 2),
    top: 800,
  });

  if (bannerBuffer) {
    const processedBanner = await sharp(bannerBuffer)
      .resize(CARD_WIDTH, BANNER_HEIGHT, { fit: "cover" })
      .blur(1)
      .toBuffer();

    composites.push({ input: processedBanner, left: 0, top: 0 });
    composites.push({
      input: Buffer.from(
        `<svg width="${CARD_WIDTH}" height="${BANNER_HEIGHT}"><rect width="${CARD_WIDTH}" height="${BANNER_HEIGHT}" fill="#000000" opacity="0.22" /></svg>`
      ),
      left: 0,
      top: 0,
    });
  }

  return sharp(Buffer.from(svg))
    .composite(composites)
    .png({ quality: 95 })
    .toBuffer();
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
