import sharp, { OverlayOptions } from "sharp";
import axios from "axios";
import { formatEventDate } from "@/utils/helpers";

interface TicketCardOptions {
  eventName: string;
  eventDate: string;
  venue: string;
  guest: string;
  tier: string;
  qrBuffer: Buffer;
  brand?: string;
  banner?: string;
  status?: string; // kept for future use
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
  overlay: "rgba(0, 0, 0, 0.25)",
} as const;

export async function createTicketCard({
  eventName,
  eventDate,
  venue,
  guest,
  tier,
  qrBuffer,
  brand = "OX",
  banner,
}: TicketCardOptions): Promise<Buffer> {
  // -----------------------------
  // Load banner (safe)
  // -----------------------------
  let bannerBuffer: Buffer | null = null;

  if (banner) {
    try {
      const response = await axios.get(banner, { responseType: "arraybuffer" });
      bannerBuffer = Buffer.from(response.data);
    } catch (error) {
      console.error("Failed to load banner image:", error);
      // Continue without banner — don't break ticket generation
    }
  }

  // -----------------------------
  // SVG Layout
  // -----------------------------
  const svg = `
    <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .title {
            font-family: Arial, sans-serif;
            font-size: 42px;
            font-weight: 700;
            fill: ${COLORS.textPrimary};
          }
          .subtitle {
            font-family: Arial, sans-serif;
            font-size: 24px;
            fill: ${COLORS.textSecondary};
          }
          .label {
            font-family: Arial, sans-serif;
            font-size: 18px;
            font-weight: 500;
            letter-spacing: 1.5px;
            fill: ${COLORS.textMuted};
          }
          .value {
            font-family: Arial, sans-serif;
            font-size: 28px;
            font-weight: 600;
            fill: ${COLORS.textPrimary};
          }
        </style>
      </defs>

      <!-- Main card background -->
      <rect 
        width="${CARD_WIDTH}" 
        height="${CARD_HEIGHT}" 
        rx="32" 
        fill="${COLORS.background}"
      />

      <!-- Banner area background -->
      <rect 
        x="0" 
        y="0" 
        width="${CARD_WIDTH}" 
        height="${BANNER_HEIGHT}" 
        fill="${COLORS.bannerBg}"
      />

      <!-- Content -->
      <text x="48" y="270" class="label">TICKET</text>
      <text x="48" y="330" class="title">${escapeXml(eventName)}</text>
      <text x="48" y="380" class="subtitle">${formatEventDate(eventDate)}</text>
      <text x="48" y="415" class="subtitle">${escapeXml(venue)}</text>

      <!-- Guest Box -->
      <rect 
        x="40" 
        y="490" 
        width="720" 
        height="125" 
        rx="20" 
        fill="${COLORS.boxBg}"
      />
      <text x="60" y="535" class="label">GUEST</text>
      <text x="60" y="585" class="value">${escapeXml(guest)}</text>

      <!-- Tier Box -->
      <rect 
        x="40" 
        y="645" 
        width="720" 
        height="125" 
        rx="20" 
        fill="${COLORS.boxBg}"
      />
      <text x="60" y="690" class="label">TICKET TYPE</text>
      <text x="60" y="740" class="value">${escapeXml(tier)}</text>

      <!-- QR Code Label -->
      <text 
        x="50%" 
        y="975" 
        text-anchor="middle" 
        class="label"
      >
        Scan QR Code for Entry
      </text>

      <!-- Brand Footer -->
      <text 
        x="50%" 
        y="1145" 
        text-anchor="middle" 
        class="subtitle"
      >
        Powered by ${escapeXml(brand)}
      </text>
    </svg>
  `;

  const composites: OverlayOptions[] = [];

  // -----------------------------
  // QR Code
  // -----------------------------
  composites.push({
    input: await sharp(qrBuffer)
      .resize(260, 260)
      .png()
      .toBuffer(),
    left: Math.floor((CARD_WIDTH - 260) / 2), // centered
    top: 800,
  });

  // -----------------------------
  // Banner + Overlay
  // -----------------------------
  if (bannerBuffer) {
    const processedBanner = await sharp(bannerBuffer)
      .resize(CARD_WIDTH, BANNER_HEIGHT, { fit: "cover" })
      .blur(1)
      .toBuffer();

    composites.push({
      input: processedBanner,
      left: 0,
      top: 0,
    });

    // Subtle dark overlay for text readability (if text were on banner)
    composites.push({
      input: Buffer.from(`
        <svg width="${CARD_WIDTH}" height="${BANNER_HEIGHT}">
          <rect 
            width="${CARD_WIDTH}" 
            height="${BANNER_HEIGHT}" 
            fill="#000000" 
            opacity="0.22"
          />
        </svg>
      `),
      left: 0,
      top: 0,
    });
  }

  // -----------------------------
  // Final Render
  // -----------------------------
  return await sharp(Buffer.from(svg))
    .composite(composites)
    .png({ quality: 95 })
    .toBuffer();
}

/** Helper to prevent XML injection in SVG */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}