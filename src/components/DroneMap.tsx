import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

interface DroneMapProps {
  droneLocation?: { lat: number; lng: number } | null;
  pickupLocation?: { lat: number; lng: number } | null;
  onMapReady?: () => void;
  mapboxToken?: string;
  onTokenSubmit?: (token: string) => void;
}

const DroneMap = ({ 
  droneLocation, 
  pickupLocation, 
  onMapReady,
  mapboxToken,
  onTokenSubmit 
}: DroneMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const droneMarker = useRef<mapboxgl.Marker | null>(null);
  const pickupMarker = useRef<mapboxgl.Marker | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  // Initialize map when token is available
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || isMapInitialized) return;

    mapboxgl.accessToken = mapboxToken;
    
    const initialCenter: [number, number] = pickupLocation 
      ? [pickupLocation.lng, pickupLocation.lat] 
      : [-118.2437, 34.0522]; // Default to LA

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      zoom: 14,
      center: initialCenter,
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setIsMapInitialized(true);
      onMapReady?.();
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, pickupLocation, onMapReady, isMapInitialized]);

  // Update drone marker
  useEffect(() => {
    if (!map.current || !isMapInitialized || !droneLocation) return;

    if (droneMarker.current) {
      droneMarker.current.setLngLat([droneLocation.lng, droneLocation.lat]);
    } else {
      // Create drone marker with custom element
      const el = document.createElement('div');
      el.className = 'drone-marker';
      el.innerHTML = `
        <div class="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="6" width="16" height="10" rx="2" ry="2" />
            <rect x="10" y="2" width="4" height="4" rx="1" />
            <circle cx="9" cy="11" r="1.5" fill="white" />
            <circle cx="15" cy="11" r="1.5" fill="white" />
            <circle cx="7" cy="19" r="2" />
            <circle cx="17" cy="19" r="2" />
            <line x1="7" y1="16" x2="7" y2="17" />
            <line x1="17" y1="16" x2="17" y2="17" />
          </svg>
        </div>
      `;
      
      droneMarker.current = new mapboxgl.Marker(el)
        .setLngLat([droneLocation.lng, droneLocation.lat])
        .addTo(map.current);
    }

    // Fly to drone location
    map.current.flyTo({
      center: [droneLocation.lng, droneLocation.lat],
      zoom: 15,
      duration: 1000
    });
  }, [droneLocation, isMapInitialized]);

  // Update pickup marker
  useEffect(() => {
    if (!map.current || !isMapInitialized || !pickupLocation) return;

    if (pickupMarker.current) {
      pickupMarker.current.setLngLat([pickupLocation.lng, pickupLocation.lat]);
    } else {
      // Create pickup marker
      const el = document.createElement('div');
      el.className = 'pickup-marker';
      el.innerHTML = `
        <div class="w-8 h-8 bg-secondary rounded-full flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;
      
      pickupMarker.current = new mapboxgl.Marker(el)
        .setLngLat([pickupLocation.lng, pickupLocation.lat])
        .addTo(map.current);
    }
  }, [pickupLocation, isMapInitialized]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      onTokenSubmit?.(tokenInput.trim());
    }
  };

  if (!mapboxToken) {
    return (
      <div className="relative w-full h-full min-h-[400px] bg-muted rounded-xl flex items-center justify-center">
        <div className="text-center p-6 max-w-md">
          <div className="w-16 h-16 eco-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-primary-foreground" />
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">
            Mapbox Token Required
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Enter your Mapbox public token to enable drone tracking. Get one free at{' '}
            <a 
              href="https://mapbox.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              mapbox.com
            </a>
          </p>
          <form onSubmit={handleTokenSubmit} className="space-y-3">
            <div className="space-y-2 text-left">
              <Label htmlFor="mapbox-token">Public Token</Label>
              <Input
                id="mapbox-token"
                type="text"
                placeholder="pk.eyJ1Ijoi..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
            </div>
            <Button type="submit" variant="eco" className="w-full">
              <Navigation className="w-4 h-4 mr-2" />
              Enable Map
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-xl shadow-lg overflow-hidden" />
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-card">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded-full" />
            <span>Drone</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-secondary rounded-full" />
            <span>Pickup</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DroneMap;
