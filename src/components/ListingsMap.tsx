import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Listing {
  id: string;
  title: string;
  slug: string;
  fixed_price: number;
  location_zip: string | null;
  distance: number | null;
}

interface ListingsMapProps {
  listings: Listing[];
  userZipCode?: string;
}

// Cache for Mapbox token and geocoded coordinates
let cachedToken: string | null = null;
const geocodeCache = new Map<string, [number, number]>();

const ListingsMap = ({ listings, userZipCode }: ListingsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // Get or fetch the Mapbox token
  const getToken = useCallback(async () => {
    if (cachedToken) return cachedToken;
    
    const { data, error } = await supabase.functions.invoke('get-mapbox-token');
    if (error) throw error;
    if (!data?.token) throw new Error('No token received');
    
    cachedToken = data.token;
    return cachedToken;
  }, []);

  // Geocode a ZIP code with caching
  const geocodeZip = useCallback(async (zip: string, token: string): Promise<[number, number] | null> => {
    if (geocodeCache.has(zip)) {
      return geocodeCache.get(zip)!;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${zip}.json?types=postcode&country=US&access_token=${token}`
      );
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const coords: [number, number] = data.features[0].center;
        geocodeCache.set(zip, coords);
        return coords;
      }
    } catch (error) {
      console.error(`Error geocoding ${zip}:`, error);
    }
    return null;
  }, []);

  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current) return;

      try {
        const token = await getToken();
        mapboxgl.accessToken = token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-98.5795, 39.8283],
          zoom: 4,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
          setLoading(false);
          setMapReady(true);
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        toast.error('Failed to load map');
        setLoading(false);
      }
    };

    initMap();

    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, [getToken]);

  // Update markers when listings change or map is ready
  useEffect(() => {
    if (!map.current || !mapReady) return;

    const updateMarkers = async () => {
      // Remove existing markers
      markers.current.forEach(marker => marker.remove());
      markers.current = [];

      const token = mapboxgl.accessToken;
      const bounds = new mapboxgl.LngLatBounds();
      let hasValidCoordinates = false;

      // Filter listings with ZIP codes and geocode in parallel
      const listingsWithZip = listings.filter(l => l.location_zip);
      
      const geocodePromises = listingsWithZip.map(listing => 
        geocodeZip(listing.location_zip!, token)
          .then(coords => ({ listing, coords }))
      );

      const results = await Promise.all(geocodePromises);

      // Create markers for successfully geocoded listings
      for (const { listing, coords } of results) {
        if (!coords) continue;

        const [lng, lat] = coords;

        const popupContent = `
          <div class="p-2">
            <h3 class="font-semibold text-sm mb-1">${listing.title}</h3>
            <p class="text-xs text-gray-600 mb-1">$${listing.fixed_price}</p>
            ${listing.distance !== null ? `<p class="text-xs text-primary font-medium">${listing.distance.toFixed(1)} mi away</p>` : ''}
            <a href="/listings/${listing.slug}" class="text-xs text-primary hover:underline">View Details</a>
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.cssText = `
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background-color: ${listing.distance !== null ? '#0EA5E9' : '#64748B'};
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: white;
          font-weight: bold;
        `;
        el.textContent = '$';

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current.push(marker);
        bounds.extend([lng, lat]);
        hasValidCoordinates = true;
      }

      if (hasValidCoordinates && !bounds.isEmpty()) {
        map.current!.fitBounds(bounds, {
          padding: 50,
          maxZoom: 12,
        });
      }
    };

    updateMarkers();
  }, [listings, mapReady, geocodeZip]);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingsMap;
