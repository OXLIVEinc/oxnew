import sharp, { OverlayOptions } from "sharp";
import { formatEventDate, formatEventTimeRangeCard } from "@/modules/whatsapp/lib/datetime";
import path from "path";

interface TicketCardOptions {
  eventName: string;
  eventStartsAt: Date | string;
  eventEndsAt?: Date | string | null;
  address: string;
  guest: string;
  tier: string;
  qrBuffer: Buffer;
  brand?: string;
  banner?: string;
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
  // Load Logo
  // -----------------------------
  const logoPath = path.join(process.cwd(), "client", "public", "ox-logo.jpg");
  let logoBuffer: Buffer | null = null;

  try {
    logoBuffer = await sharp(logoPath).resize({ height: 28, fit: "contain" }).png().toBuffer();
  } catch (error) {
    console.error("[create-ticket-card] failed to load ox-logo image:", error);
  }

  // -----------------------------
  // Load Banner
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
  const timeLine = formatEventTimeRangeCard(eventStartsAt, eventEndsAt);
  const safeAddress = truncateText(address, 42);
  const safeEventName = truncateText(eventName, 28);

  // Combine date and AM/PM time on one clean line
  const fullDateTime = timeLine ? `${dateLine} • ${timeLine}` : dateLine;

  // -----------------------------
  // SVG Layout
  // -----------------------------
  const svg = `
    <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .title { font-family: 'Inter', Arial, sans-serif; font-size: 40px; font-weight: 700; fill: ${COLORS.textPrimary}; }
          .subtitle { font-family: 'Inter', Arial, sans-serif; font-size: 22px; fill: ${COLORS.textSecondary}; }
          .label { font-family: 'Inter', Arial, sans-serif; font-size: 18px; font-weight: 500; letter-spacing: 1.5px; fill: ${COLORS.textMuted}; }
          .value { font-family: 'Inter', Arial, sans-serif; font-size: 28px; font-weight: 600; fill: ${COLORS.textPrimary}; }
        </style>
      </defs>

      <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="32" fill="${COLORS.background}" />
      <rect x="0" y="0" width="${CARD_WIDTH}" height="${BANNER_HEIGHT}" fill="${COLORS.bannerBg}" />

      <!-- Label & Title -->
      <text x="48" y="260" class="label">TICKET</text>
      <text x="48" y="310" class="title">${escapeXml(safeEventName)}</text>
      
      <!-- Date & AM/PM Time Line -->
      <text x="48" y="355" class="subtitle">${escapeXml(fullDateTime)}</text>
      
      <!-- Address on its own line -->
      <text x="48" y="392" class="subtitle">${escapeXml(safeAddress)}</text>

      <!-- Guest Box -->
      <rect x="40" y="465" width="720" height="120" rx="20" fill="${COLORS.boxBg}" />
      <text x="60" y="508" class="label">GUEST</text>
      <text x="60" y="555" class="value">${escapeXml(guest)}</text>

      <!-- Tier Box -->
      <rect x="40" y="610" width="720" height="120" rx="20" fill="${COLORS.boxBg}" />
      <text x="60" y="653" class="label">TICKET TYPE</text>
      <text x="60" y="700" class="value">${escapeXml(tier)}</text>

      <!-- QR Code Label -->
      <text x="50%" y="955" text-anchor="middle" class="label">Scan QR Code for Entry</text>
      
      <!-- Footer Text -->
      <text x="${logoBuffer ? "370" : "50%"}" y="1145" text-anchor="${logoBuffer ? "end" : "middle"}" class="subtitle">
        Powered by ${escapeXml(brand)}
      </text>
    </svg>
  `;

  const composites: OverlayOptions[] = [];

  // QR Code Overlay
  composites.push({
    input: await sharp(qrBuffer).resize(240, 240).png().toBuffer(),
    left: Math.floor((CARD_WIDTH - 240) / 2),
    top: 780,
  });

  // Banner Overlay
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

  // Logo Overlay (Placed beside "Powered by OX")
  if (logoBuffer) {
    composites.push({
      input: logoBuffer,
      left: 385,
      top: 1124,
    });
  }

  return sharp(Buffer.from(svg))
    .composite(composites)
    .png({ quality: 95 })
    .toBuffer();
}

function truncateText(str: string, maxLength: number): string {
  if (!str) return "";
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}