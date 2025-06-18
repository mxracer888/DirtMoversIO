import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Truck, User, Clock, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TruckLocation {
  truckId: number;
  truckNumber: string;
  companyName: string;
  driverName: string;
  latitude: number;
  longitude: number;
  lastUpdateTime: string;
  status: string;
  currentActivity?: string;
}

interface TruckLocationMapProps {
  className?: string;
}

export default function TruckLocationMap({ className }: TruckLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [selectedTruck, setSelectedTruck] = useState<TruckLocation | null>(null);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  const [mapboxError, setMapboxError] = useState<string | null>(null);

  // Fetch truck locations from API
  const { data: truckLocations = [], isLoading, refetch } = useQuery<TruckLocation[]>({
    queryKey: ['/api/truck-locations'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000,
  });

  // Load Mapbox dynamically
  useEffect(() => {
    const loadMapbox = async () => {
      try {
        // Dynamically import mapbox-gl
        const mapboxgl = (await import('mapbox-gl')).default;
        
        // Import CSS
        await import('mapbox-gl/dist/mapbox-gl.css');
        
        if (!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN) {
          throw new Error('Mapbox access token not found');
        }
        
        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        
        if (mapRef.current && !mapInstanceRef.current) {
          const map = new mapboxgl.Map({
            container: mapRef.current,
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-111.8910, 40.7608], // Salt Lake City area
            zoom: 10
          });
          
          mapInstanceRef.current = map;
          
          map.on('load', () => {
            setMapboxLoaded(true);
          });
          
          map.on('error', (e) => {
            console.error('Mapbox error:', e);
            setMapboxError('Map failed to load');
          });
        }
      } catch (error) {
        console.error('Failed to load Mapbox:', error);
        setMapboxError('Failed to initialize map');
      }
    };
    
    loadMapbox();
    
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when truck locations change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapboxLoaded || !truckLocations.length) return;
    
    const map = mapInstanceRef.current;
    
    // Remove existing markers
    const existingMarkers = document.querySelectorAll('.truck-marker');
    existingMarkers.forEach(marker => marker.remove());
    
    // Add new markers
    truckLocations.forEach((truck) => {
      const markerColor = getMarkerColor(truck.status, truck.currentActivity);
      
      // Create marker element
      const markerEl = document.createElement('div');
      markerEl.className = 'truck-marker';
      markerEl.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background-color: ${markerColor};
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
          </svg>
        </div>
      `;
      
      markerEl.addEventListener('click', () => {
        setSelectedTruck(truck);
      });
      
      // Add marker to map using Mapbox GL
      const mapboxgl = (window as any).mapboxgl || require('mapbox-gl');
      new mapboxgl.Marker(markerEl)
        .setLngLat([truck.longitude, truck.latitude])
        .addTo(map);
    });
    
    // Fit map to show all trucks
    if (truckLocations.length > 0) {
      const coordinates = truckLocations.map(truck => [truck.longitude, truck.latitude]);
      
      if (coordinates.length === 1) {
        map.flyTo({
          center: coordinates[0],
          zoom: 12
        });
      } else {
        const bounds = coordinates.reduce(
          (bounds, coord) => bounds.extend(coord),
          new (window as any).mapboxgl.LngLatBounds(coordinates[0], coordinates[0])
        );
        
        map.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    }
  }, [truckLocations, mapboxLoaded]);

  const getMarkerColor = (status: string, activity?: string) => {
    if (activity === 'arrive_at_load_site' || activity === 'loaded_with_material') return '#22c55e'; // Green - loading
    if (activity === 'arrive_at_dump_site' || activity === 'dumped_material') return '#3b82f6'; // Blue - dumping
    if (status === 'active') return '#f59e0b'; // Amber - active/moving
    return '#6b7280'; // Gray - inactive
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading truck locations...</p>
        </div>
      </div>
    );
  }

  if (mapboxError) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-4">{mapboxError}</p>
          <Button onClick={() => window.location.reload()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="h-96 w-full rounded-lg" />
      
      {!mapboxLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Initializing map...</p>
          </div>
        </div>
      )}
      
      {truckLocations.length === 0 && mapboxLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No active trucks with GPS data</p>
          </div>
        </div>
      )}
      
      {/* Truck info popup */}
      {selectedTruck && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 min-w-[250px] border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <span className="font-semibold">{selectedTruck.truckNumber}</span>
              <Badge 
                variant="secondary"
                style={{ 
                  backgroundColor: getMarkerColor(selectedTruck.status, selectedTruck.currentActivity),
                  color: 'white'
                }}
              >
                {selectedTruck.status}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTruck(null)}
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-muted-foreground" />
              <span>{selectedTruck.driverName}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs">{selectedTruck.companyName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatTimeAgo(selectedTruck.lastUpdateTime)}
              </span>
            </div>
            {selectedTruck.currentActivity && (
              <div className="mt-3 pt-2 border-t">
                <span className="text-xs font-medium">
                  Current: {selectedTruck.currentActivity.replace(/_/g, ' ')}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Manual refresh button */}
      <Button
        onClick={() => refetch()}
        variant="outline"
        size="sm"
        className="absolute bottom-4 right-4"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  );
}