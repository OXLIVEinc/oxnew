import { useState, useCallback } from 'react';
import { usePhotonAutocomplete,type PhotonSuggestion } from './useLocationAutocomplete';

export interface EventLocation {
  venueName: string;
  venueAddress: string;
  latitude: number;
  longitude: number;
  source: 'photon' | 'map' | 'manual';
}


export function useLocationSelector() {
  const [selected, setSelected] = useState<EventLocation | null>(null);
  const photon = usePhotonAutocomplete();

  const selectFromPhoton = useCallback((suggestion: PhotonSuggestion) => {
    setSelected({
      venueName: suggestion.label.split(',')[0]?.trim() || suggestion.label,
      venueAddress: suggestion.label,
      latitude: suggestion.lat,
      longitude: suggestion.lng,
      source: 'photon'
    });
  }, []);

  const selectFromMap = useCallback((lat: number, lng: number, address: string = '') => {
    setSelected({
      venueName: address ? address.split(',')[0]?.trim() || 'Selected Venue' : 'Selected Location',
      venueAddress: address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      latitude: lat,
      longitude: lng,
      source: 'map'
    });
  }, []);

  const clear = useCallback(() => {
    setSelected(null);
    photon.clear();
  }, [photon]);

  return {
    ...photon,
    selected,
    selectFromPhoton,
    selectFromMap,
    clear,
  };
}