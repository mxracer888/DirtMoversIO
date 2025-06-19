import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Clock, User, Loader2, AlertTriangle } from 'lucide-react';
import L from 'leaflet';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

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
  const [selectedTruck, setSelectedTruck] = useState<TruckLocation | null>(null);
  const [mapLoadError, setMapLoadError] = useState(false);
  const [isContainerVisible, setIsContainerVisible] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  // Fetch truck locations from API
  const { data: truckLocations = [], isLoading, error } = useQuery<TruckLocation[]>({
    queryKey: ['/api/truck-locations'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Set up intersection observer to detect when container becomes visible
  useEffect(() => {
    if (!mapRef.current) return;

    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsContainerVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    intersectionObserverRef.current.observe(mapRef.current);

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, []);

  // Force map resize when truck locations are loaded
  useEffect(() => {
    if (mapInstanceRef.current && truckLocations.length > 0) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 250);
    }
  }, [truckLocations]);

  // Initialize map when container becomes visible
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !isContainerVisible) return;

    // Create map centered on Salt Lake City
    const map = L.map(mapRef.current).setView([40.7608, -111.8910], 10);

    // Add tile layer with error handling
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
      errorTileUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU2IiBoZWlnaHQ9IjI1NiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmY2NjY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1hcCBUaWxlIEVycm9yPC90ZXh0Pjwvc3ZnPg=='
    });
    
    tileLayer.on('tileerror', function(error) {
      console.warn('Map tile failed to load:', error);
      setMapLoadError(true);
    });
    
    tileLayer.on('tileload', function() {
      setMapLoadError(false);
    });
    
    tileLayer.addTo(map);

    // Force map to resize and invalidate size after initialization
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    mapInstanceRef.current = map;

    // Set up ResizeObserver to handle container size changes
    if (mapRef.current && window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      });
      resizeObserverRef.current.observe(mapRef.current);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isContainerVisible]);

  // Update markers when truck locations change
  useEffect(() => {
    if (!mapInstanceRef.current || !truckLocations.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    truckLocations.forEach((truck) => {
      if (truck.latitude && truck.longitude) {
        const marker = L.marker([truck.latitude, truck.longitude])
          .addTo(mapInstanceRef.current!)
          .bindPopup(`
            <div class="p-2">
              <h3 class="font-semibold">${truck.truckNumber}</h3>
              <p class="text-sm">${truck.driverName}</p>
              <p class="text-sm">${truck.companyName}</p>
              <p class="text-xs text-gray-500">Activity: ${truck.currentActivity}</p>
              <p class="text-xs text-gray-500">Last Update: ${new Date(truck.lastUpdateTime).toLocaleString()}</p>
            </div>
          `);
        
        markersRef.current.push(marker);
      }
    });
  }, [truckLocations]);

  const getStatusColor = (status: string, activity?: string) => {
    if (activity === 'arrive_at_load_site' || activity === 'loaded_with_material') return 'bg-green-500';
    if (activity === 'arrive_at_dump_site' || activity === 'dumped_material') return 'bg-blue-500';
    if (status === 'active') return 'bg-amber-500';
    return 'bg-gray-500';
  };

  const getStatusLabel = (status: string, activity?: string) => {
    if (activity === 'arrive_at_load_site') return 'At Load Site';
    if (activity === 'loaded_with_material') return 'Loaded';
    if (activity === 'arrive_at_dump_site') return 'At Dump Site';
    if (activity === 'dumped_material') return 'Dumped';
    if (status === 'active') return 'Active';
    return 'Inactive';
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Truck Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading truck locations...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Truck Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600">Error loading truck locations</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Truck Locations
          <Badge variant="secondary" className="ml-auto">
            {truckLocations.length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Interactive Map */}
          <div 
            ref={mapRef} 
            className="w-full h-96 rounded-lg border border-gray-200"
            style={{ minHeight: '384px' }}
          />
          
          {/* Map Fallback - Show truck list if map fails */}
          {mapLoadError && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <p className="text-sm text-amber-800 font-medium">Map temporarily unavailable</p>
              </div>
              <div className="space-y-3">
                {truckLocations.map((truck) => (
                  <div key={truck.truckId} className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Truck className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{truck.truckNumber}</h4>
                          <p className="text-sm text-muted-foreground">{truck.driverName}</p>
                          <p className="text-sm text-muted-foreground">{truck.companyName}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs text-muted-foreground">
                              {new Date(truck.lastUpdateTime).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={truck.status === 'active' ? 'default' : 'secondary'}>
                          {getStatusLabel(truck.status, truck.currentActivity)}
                        </Badge>
                        <div className="flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs text-muted-foreground">
                            {truck.latitude.toFixed(4)}, {truck.longitude.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Truck Status Summary */}
          {!mapLoadError && truckLocations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {truckLocations.map((truck) => (
                <div key={truck.truckId} className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(truck.status, truck.currentActivity)}`} />
                      <span className="font-medium text-sm">{truck.truckNumber}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {getStatusLabel(truck.status, truck.currentActivity)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground">{truck.driverName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(truck.lastUpdateTime).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}