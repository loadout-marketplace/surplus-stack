import { useEffect, useRef, useState } from 'react';
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

const ListingsMap = ({ listings, userZipCode }: ListingsMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current) return;

      try {
        // Fetch Mapbox token from edge function
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        
        if (error) throw error;
        if (!data?.token) throw new Error('No token received');

        mapboxgl.accessToken = data.token;

        // Initialize map centered on US
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-98.5795, 39.8283], // Center of US
          zoom: 4,
        });

        // Add navigation controls
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.current.on('load', () => {
          setLoading(false);
          updateMarkers();
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
  }, []);

  useEffect(() => {
    if (map.current && !loading) {
      updateMarkers();
    }
  }, [listings, loading]);

  const updateMarkers = async () => {
    if (!map.current) return;

    // Remove existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add new markers for each listing with valid coordinates
    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoordinates = false;

    for (const listing of listings) {
      if (!listing.location_zip) continue;

      try {
        // Use Mapbox Geocoding API to get coordinates from zip code
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${listing.location_zip}.json?types=postcode&country=US&access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          
          // Create popup content
          const popupContent = `
            <div class="p-2">
              <h3 class="font-semibold text-sm mb-1">${listing.title}</h3>
              <p class="text-xs text-gray-600 mb-1">$${listing.fixed_price}</p>
              ${listing.distance !== null ? `<p class="text-xs text-primary font-medium">${listing.distance.toFixed(1)} mi away</p>` : ''}
              <a href="/listings/${listing.slug}" class="text-xs text-primary hover:underline">View Details</a>
            </div>
          `;

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);

          // Create marker
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = listing.distance !== null ? '#0EA5E9' : '#64748B';
          el.style.border = '2px solid white';
          el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          el.style.cursor = 'pointer';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.fontSize = '12px';
          el.style.color = 'white';
          el.style.fontWeight = 'bold';
          el.textContent = '$';

          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map.current!);

          markers.current.push(marker);
          bounds.extend([lng, lat]);
          hasValidCoordinates = true;
        }
      } catch (error) {
        console.error(`Error geocoding ${listing.location_zip}:`, error);
      }
    }

    // Fit map to show all markers
    if (hasValidCoordinates && !bounds.isEmpty()) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });
    }
  };

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
