import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { ENV } from '../config/env';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const libraries = useMemo<("drawing" | "geometry" | "places" | "visualization")[]>(
    () => ['geometry', 'drawing', 'places', 'visualization'],
    []
  );

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: ENV.GOOGLE_MAP_KEY,
    libraries,
    language: 'vi', // Ưu tiên tiếng Việt
    region: 'VN'    // Ưu tiên vùng Việt Nam
  });

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (context === undefined) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
}
