import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * src/hooks/usePhotonAutocomplete.ts
 * -------------------------------------------------------------------------
 * Free, keyless address autocomplete backed by Photon.
 * Enhanced to better support "Can't find your venue? 📍 Pick on map" flow.
 * -------------------------------------------------------------------------
 */

const PHOTON_BASE_URL = 'https://photon.komoot.io/api/';
const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 3;
const RESULT_LIMIT = 5;

export interface PhotonSuggestion {
  id: string;
  label: string;
  lat: number;
  lng: number;
  raw: PhotonFeature;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
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
  const [showMapPrompt, setShowMapPrompt] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback(async (query: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setShowMapPrompt(false);

    try {
      const url = `${PHOTON_BASE_URL}?q=${encodeURIComponent(query)}&limit=${RESULT_LIMIT}`;
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) throw new Error(`Photon request failed: ${res.status}`);

      const data = (await res.json()) as PhotonResponse;
      const results = (data.features || []).map(toSuggestion);

      setSuggestions(results);
      setShowMapPrompt(results.length === 0); // Show "Pick on map" prompt when no results
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;

      setError('Could not load location suggestions.');
      setSuggestions([]);
      setShowMapPrompt(true); // Still offer map as fallback
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
        setShowMapPrompt(false);
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
    setShowMapPrompt(false);
  }, []);

  // New: Force show map prompt (useful when user clicks "Can't find your venue?")
  const showManualMapOption = useCallback(() => {
    setShowMapPrompt(true);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return {
    suggestions,
    loading,
    error,
    showMapPrompt,           // ← New: tells UI to show "Can't find your venue?" prompt
    search,
    clear,
    showManualMapOption,     // ← New: call this when user clicks the map button
  };
}