import { useJsApiLoader } from '@react-google-maps/api';

export const useGoogleMaps = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  return { isLoaded, loadError };
};

export const mapOptions = {
  mapTypeId: 'satellite',
  mapTypeControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  zoomControl: true,
};

export const defaultMapContainerStyle = {
  width: '100%',
  height: '300px',
}; 