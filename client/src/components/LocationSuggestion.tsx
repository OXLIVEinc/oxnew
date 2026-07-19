export interface LocationSuggestion {
  id: string;
  label: string;
  lat: number;
  lng: number;
}

interface LocationSuggestionsProps {
  suggestions: LocationSuggestion[];
  loading?: boolean;
  error?: string | null;
  onSelect: (place: LocationSuggestion) => void;
}

export function LocationSuggestions({
  suggestions,
  loading = false,
  error,
  onSelect,
}: LocationSuggestionsProps) {
  if (loading) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-lg">
        Searching...
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-red-200 bg-white p-4 text-sm text-red-500 shadow-lg">
        {error}
      </div>
    );
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
      {suggestions.map((place) => (
        <button
          key={place.id}
          type="button"
          onClick={() => onSelect(place)}
          className="block w-full border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-none hover:bg-gray-100"
        >
          <div className="font-medium text-black">
            {place.label.split(",")[0]}
          </div>

          <div className="truncate text-sm text-gray-600">
            {place.label}
          </div>
        </button>
      ))}
    </div>
  );
}