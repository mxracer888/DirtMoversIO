import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, MapPin, Clock, User, Loader2 } from 'lucide-react';
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
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Fetch truck locations from API
  const { data: truckLocations = [], isLoading, error } = useQuery<TruckLocation[]>({
    queryKey: ['/api/truck-locations'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

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
    });
    
    tileLayer.addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

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
          
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">Failed to load truck locations</p>
            </div>
          )}

          {/* Status Legend */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Loading</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Dumping</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Inactive</span>
            </div>
          </div>

          {/* Truck List */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-muted-foreground">Active Trucks</h4>
            {truckLocations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active trucks found
              </div>
            ) : (
              truckLocations.map((truck: TruckLocation) => (
                <div
                  key={truck.truckId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setSelectedTruck(selectedTruck?.truckId === truck.truckId ? null : truck)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-3 h-3 rounded-full ${getStatusColor(truck.status, truck.currentActivity)}`}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        <span className="font-medium">Truck #{truck.truckNumber}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {truck.driverName}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(truck.lastUpdateTime).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={truck.status === 'active' ? 'default' : 'secondary'}>
                      {getStatusLabel(truck.status, truck.currentActivity)}
                    </Badge>
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected Truck Details */}
          {selectedTruck && (
            <div className="p-4 bg-blue-50 rounded-lg border">
              <h4 className="font-medium mb-2">Truck #{selectedTruck.truckNumber} Details</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Driver:</span>
                  <div className="font-medium">{selectedTruck.driverName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Company:</span>
                  <div className="font-medium">{selectedTruck.companyName}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <div className="font-medium">{selectedTruck.latitude.toFixed(4)}, {selectedTruck.longitude.toFixed(4)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Update:</span>
                  <div className="font-medium">{new Date(selectedTruck.lastUpdateTime).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}