/**
 * Turns a free-text address into { lat, lng }. This is called from the
 * frontend dashboard at event/hotel creation time — NOT from the WhatsApp
 * bot itself — since that's the only place a human is typing a fresh
 * address that needs coordinates resolved.
 *
 * Uses OpenStreetMap's Nominatim (no API key required). Swap the
 * implementation for Google Geocoding / Mapbox if you need higher volume
 * or better accuracy — the signature is all that matters to callers.
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(address)}`;

  const res = await fetch(url, {
    headers: {
      // Nominatim's usage policy requires a descriptive UA on every request.
      "User-Agent": "ox-whatsapp-bot/1.0 (contact: ops@ox.app)",
    },
  });

  if (!res.ok) {
    throw new Error(`Geocoding request failed: ${res.status}`);
  }

  const results = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  if (!results.length) return null;

  return {
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
    displayName: results[0].display_name,
  };
}

/** Straight-line distance between two coordinates, in kilometers. */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371; // Earth radius, km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
