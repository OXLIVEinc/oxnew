import sharp, { OverlayOptions } from "sharp";
import axios from "axios";
import path from "node:path";
import { Buffer } from "node:buffer";

const logo = path.join(process.cwd(), "src", "assets", "ox-logo.png");

interface TicketCardOptions {
  eventName: string;
  eventDate: string; // e.g. "Wednesday, 19 August 2026"
  eventTime?: string; // e.g. "16:00 to 00:00" or ISO string
  venue: string;
  guest: string;
  tier: string;
  qrBuffer: Buffer;
  brand?: string;
  banner?: string;
  status?: string;
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
  eventTime,
  venue,
  guest,
  tier,
  qrBuffer,
  brand = "OX",
  banner,
}: TicketCardOptions): Promise<Buffer> {
  // -----------------------------
  // Load Banner & Logo
  // -----------------------------
  let bannerBuffer: Buffer | null = null;
  let logoBuffer: Buffer | null = null;
  

  if (banner) {
    try {
      const res = await axios.get(banner, { responseType: "arraybuffer" });
      bannerBuffer = Buffer.from(res.data);
    } catch (err) {
      console.error("Failed to load banner image:", err);
    }
  }


const b = Buffer.from("hello");

  if (logo) {
    // try {
    //   if (Buffer.isBuffer(logo)) {
    //     logoBuffer = logo;
    //   } else if (logo.startsWith("http")) {
    //     const res = await axios.get(logo, { responseType: "arraybuffer" });
    //     logoBuffer = Buffer.from(res.data);
    //   } else {
    //     logoBuffer = await sharp(logo).toBuffer();
    //   }
    // } catch (err) {
    //   console.error("Failed to load brand logo image:", err);
    // }
    await sharp(logo).toBuffer();
  }

  // Format time and clean venue string
  const formattedTime = eventTime ? formatTimeRange(eventTime) : "";
  const dateLine = formattedTime ? `${eventDate} • ${formattedTime}` : eventDate;
  const safeVenue = truncateText(venue, 42); // Prevents text overflow on 800px width

  // -----------------------------
  // SVG Layout
  // -----------------------------
  const svg = `
    <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .title {
            font-family: 'Inter', Arial, sans-serif;
            font-size: 40px;
            font-weight: 700;
            fill: ${COLORS.textPrimary};
          }
          .subtitle {
            font-family: 'Inter', Arial, sans-serif;
            font-size: 22px;
            fill: ${COLORS.textSecondary};
          }
          .label {
            font-family: 'Inter', Arial, sans-serif;
            font-size: 18px;
            font-weight: 500;
            letter-spacing: 1.5px;
            fill: ${COLORS.textMuted};
          }
          .value {
            font-family: 'Inter', Arial, sans-serif;
            font-size: 28px;
            font-weight: 600;
            fill: ${COLORS.textPrimary};
          }
        </style>
      </defs>

      <!-- Main card background -->
      <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="32" fill="${COLORS.background}" />

      <!-- Banner area background -->
      <rect x="0" y="0" width="${CARD_WIDTH}" height="${BANNER_HEIGHT}" fill="${COLORS.bannerBg}" />

      <!-- Content -->
      <text x="48" y="260" class="label">TICKET</text>
      <text x="48" y="315" class="title">${escapeXml(truncateText(eventName, 28))}</text>
      
      <!-- Date Line (Line 1) -->
      <text x="48" y="365" class="subtitle">${escapeXml(dateLine)}</text>
      
      <!-- Venue Line (Line 2 - Separate line to avoid truncation) -->
      <text x="48" y="405" class="subtitle">${escapeXml(safeVenue)}</text>

      <!-- Guest Box -->
      <rect x="40" y="475" width="720" height="125" rx="20" fill="${COLORS.boxBg}" />
      <text x="60" y="520" class="label">GUEST</text>
      <text x="60" y="570" class="value">${escapeXml(guest)}</text>

      <!-- Tier Box -->
      <rect x="40" y="630" width="720" height="125" rx="20" fill="${COLORS.boxBg}" />
      <text x="60" y="675" class="label">TICKET TYPE</text>
      <text x="60" y="725" class="value">${escapeXml(tier)}</text>

      <!-- QR Code Label -->
      <text x="50%" y="965" text-anchor="middle" class="label">Scan QR Code for Entry</text>

      <!-- Footer Text -->
      <text x="${logoBuffer ? '370' : '50%'}" y="1145" text-anchor="${logoBuffer ? 'end' : 'middle'}" class="subtitle">
        Powered by ${escapeXml(brand)}
      </text>
    </svg>
  `;

  const composites: OverlayOptions[] = [];

  // -----------------------------
  // QR Code Overlay
  // -----------------------------
  composites.push({
    input: await sharp(qrBuffer).resize(240, 240).png().toBuffer(),
    left: Math.floor((CARD_WIDTH - 240) / 2),
    top: 790,
  });

  // -----------------------------
  // Banner Overlay
  // -----------------------------
  if (bannerBuffer) {
    const processedBanner = await sharp(bannerBuffer)
      .resize(CARD_WIDTH, BANNER_HEIGHT, { fit: "cover" })
      .blur(1)
      .toBuffer();

    composites.push({ input: processedBanner, left: 0, top: 0 });
    composites.push({
      input: Buffer.from(`
        <svg width="${CARD_WIDTH}" height="${BANNER_HEIGHT}">
          <rect width="${CARD_WIDTH}" height="${BANNER_HEIGHT}" fill="#000000" opacity="0.22" />
        </svg>
      `),
      left: 0,
      top: 0,
    });
  }

  // -----------------------------
  // Brand Logo Overlay (Footer)
  // -----------------------------
  if (logoBuffer) {
    // Resize logo to match subtitle text height (~28px)
    const resizedLogo = await sharp(logoBuffer)
      .resize({ height: 28, fit: "contain" })
      .png()
      .toBuffer();

    composites.push({
      input: resizedLogo,
      left: 385, // Positioned immediately after "Powered by OX" text
      top: 1124, // Aligned vertically with baseline
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

// -----------------------------
// Helper Functions
// -----------------------------

/** Convert 24-hour range strings like "16:00 to 00:00" to "4:00 PM - 12:00 AM" */
function formatTimeRange(timeStr: string): string {
  if (!timeStr) return "";

  // Handles "16:00 to 00:00" or "16:00 - 00:00"
  const parts = timeStr.split(/\s*(?:to|-)\s*/i);
  if (parts.length === 2) {
    return `${to12Hour(parts[0])} - ${to12Hour(parts[1])}`;
  }

  return to12Hour(timeStr);
}

function to12Hour(time: string): string {
  const [hStr, mStr] = time.trim().split(":");
  let hours = parseInt(hStr, 10);
  const minutes = mStr || "00";

  if (isNaN(hours)) return time;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${ampm}`;
}

/** Truncate long strings with ellipsis if they exceed length limit */
function truncateText(str: string, maxLength: number): string {
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