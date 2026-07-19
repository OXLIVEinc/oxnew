import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * src/hooks/usePhotonAutocomplete.ts
 * -------------------------------------------------------------------------
 * Free, keyless address autocomplete backed by Photon (https://photon.komoot.io),
 * a geocoder built on OpenStreetMap data. Replaces the paid Google Places
 * Autocomplete API — no billing, no API key.
 *
 * Usage:
 *   const { suggestions, loading, search, clear } = usePhotonAutocomplete();
 *   search("victoria island lagos")
 *   // suggestions -> PhotonSuggestion[]
 *
 * Notes:
 *   - Debounced by DEBOUNCE_MS so we don't fire a request per keystroke.
 *   - In-flight requests are aborted when a newer query comes in, so a slow
 *     response for an old keystroke can never overwrite a newer result.
 *   - Photon is a shared public instance — be reasonable with request volume.
 *     If you outgrow it, the same API shape can point at a self-hosted
 *     Photon/Nominatim instance later with zero component changes.
 * -------------------------------------------------------------------------
 */

const PHOTON_BASE_URL = 'https://photon.komoot.io/api/';
const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3;
const RESULT_LIMIT = 5;

export interface PhotonSuggestion {
  id: string;
  /** Human-readable label built from Photon's address parts, e.g. "Landmark Beach, Oniru, Lagos, Nigeria" */
  label: string;
  lat: number;
  lng: number;
  raw: PhotonFeature;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] }; // [lon, lat]
  properties: {
    name?: string;
    housenumber?: string;
    street?: string;
    district?: string;
    city?: string;
    state?: string;
    country?: string;
    osm_id?: number;
    osm_type?: string;
  };
}

interface PhotonResponse {
  features: PhotonFeature[];
}

function buildLabel(props: PhotonFeature['properties']): string {
  const parts: string[] = [];

  const streetPart = [props.housenumber, props.street].filter(Boolean).join(' ');
  if (props.name && props.name !== streetPart) parts.push(props.name);
  if (streetPart) parts.push(streetPart);
  if (props.district && props.district !== props.city) parts.push(props.district);
  if (props.city) parts.push(props.city);
  if (props.state && props.state !== props.city) parts.push(props.state);
  if (props.country) parts.push(props.country);

  // De-dupe consecutive identical parts (Photon sometimes repeats name/city).
  return parts.filter((p, i) => p !== parts[i - 1]).join(', ');
}

function toSuggestion(feature: PhotonFeature, index: number): PhotonSuggestion {
  const [lng, lat] = feature.geometry.coordinates;
  const idSeed = feature.properties.osm_id ?? index;
  return {
    id: `${feature.properties.osm_type ?? 'f'}-${idSeed}-${index}`,
    label: buildLabel(feature.properties) || 'Unknown location',
    lat,
    lng,
    raw: feature,
  };
}

export function usePhotonAutocomplete() {
  const [suggestions, setSuggestions] = useState<PhotonSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (query: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const url = `${PHOTON_BASE_URL}?q=${encodeURIComponent(query)}&limit=${RESULT_LIMIT}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`Photon request failed: ${res.status}`);

      const data = (await res.json()) as PhotonResponse;
      const results = (data.features || []).map(toSuggestion);
      setSuggestions(results);
    } catch (err) {
      if ((err as Error).name === 'AbortError') return; // superseded by a newer search
      setError('Could not load location suggestions. You can still type the address manually.');
      setSuggestions([]);
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }, []);

  const search = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const trimmed = query.trim();
      if (trimmed.length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      debounceRef.current = setTimeout(() => runSearch(trimmed), DEBOUNCE_MS);
    },
    [runSearch]
  );

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setSuggestions([]);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return { suggestions, loading, error, search, clear };
}