// src/components/LocationMapModal.tsx

import { useState, useCallback, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Search, X, Loader2, MapPin, Navigation } from "lucide-react";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Props {
  onSave: (lat: number, lng: number, address: string) => void;
  onClose: () => void;
}

interface SearchResult {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, 17, {
      animate: true,
      duration: 1.2,
    });
  }, [center, map]);

  return null;
}

function MapClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

export default function LocationMapModal({ onSave, onClose }: Props) {
  const [position, setPosition] = useState<[number, number]>([6.5244, 3.3792]);
  const [address, setAddress] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      );
      const data = await res.json();
      setAddress(data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } catch {
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setGeocoding(false);
    }
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(search)}&limit=5`
        );
        const data = await res.json();
        setResults(data.features || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
        setHasSearched(true);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [search]);

  // close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const moveMarker = (lat: number, lng: number) => {
    setPosition([lat, lng]);
    reverseGeocode(lat, lng);
  };

  const handleSave = () => {
    setSaving(true);
    onSave(position[0], position[1], address);
  };

  const showDropdown = search.trim().length > 0 && (results.length > 0 || (hasSearched && !searching));

  return (
    <div className="fixed inset-0 z-[99999999999999] flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm p-4 animate-[fadeIn_0.15s_ease-out]">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 animate-[slideUp_0.2s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0F6B5C]/10">
              <MapPin className="h-4.5 w-4.5 text-[#0F6B5C]" strokeWidth={2.2} />
            </div>
            <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
              Pick exact location
            </h2>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0F6B5C]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative border-b border-neutral-100 p-4" ref={searchBoxRef}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search venue or address..."
              className="w-full rounded-xl border border-neutral-200 py-3 pl-11 pr-10 text-[15px] text-neutral-900 placeholder:text-neutral-400 transition-shadow focus:border-[#0F6B5C] focus:outline-none focus:ring-2 focus:ring-[#0F6B5C]/20"
            />
            {searching && (
              <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />
            )}
            {!searching && search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {showDropdown && (
            <div className="absolute left-4 right-4 z-[999] mt-2 overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-lg">
              {results.length > 0 ? (
                results.map((item, index) => {
                  const [lng, lat] = item.geometry.coordinates;
                  const label = [
                    item.properties.name,
                    item.properties.city,
                    item.properties.state,
                    item.properties.country,
                  ]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <button
                      key={index}
                      className="flex w-full items-start gap-3 border-b border-neutral-50 px-4 py-3 text-left text-[14px] text-neutral-800 transition-colors last:border-b-0 hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none"
                      onClick={() => {
                        setPosition([lat, lng]);
                        reverseGeocode(lat, lng);
                        setSearch(label);
                        setResults([]);
                      }}
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
                      <span>{label}</span>
                    </button>
                  );
                })
              ) : (
                <div className="px-4 py-6 text-center text-sm text-neutral-400">
                  No matches. Try a different search, or drop a pin on the map.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="relative flex-1">
          <MapContainer
            center={position}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
          >
            <ChangeView center={position} />
            <MapClickHandler onClick={(lat, lng) => moveMarker(lat, lng)} />

            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker
              position={position}
              draggable
              eventHandlers={{
                dragend(e) {
                  const marker = e.target;
                  const { lat, lng } = marker.getLatLng();
                  moveMarker(lat, lng);
                },
              }}
            />
          </MapContainer>

          {/* Coordinate readout chip */}
          <div className="pointer-events-none absolute bottom-4 left-4 z-[500] flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 shadow-md ring-1 ring-black/5 backdrop-blur-sm">
            <Navigation className="h-3 w-3 text-[#0F6B5C]" />
            <span className="font-mono text-xs tabular-nums text-neutral-600">
              {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="space-y-4 border-t border-neutral-100 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-neutral-400">
              Address
            </label>
            <div className="relative">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-[15px] text-neutral-900 transition-shadow focus:border-[#0F6B5C] focus:outline-none focus:ring-2 focus:ring-[#0F6B5C]/20"
              />
              {geocoding && (
                <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-neutral-400" />
              )}
            </div>
          </div>

          <p className="text-xs text-neutral-400">
            Search for a place, click on the map, or drag the marker to fine-tune the location.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-neutral-200 py-3.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6B5C]"
            >
              Cancel
            </button>

            <button
              disabled={!address.trim() || saving}
              onClick={handleSave}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#0F6B5C] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-neutral-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6B5C]"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Location
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .leaflet-marker-icon {
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
        }
      `}</style>
    </div>
  );
}