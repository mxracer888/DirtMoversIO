import React, { useEffect, useRef } from 'react';
import Map, { Marker, Popup, ViewState } from 'react-map-gl';
import { useQuery } from '@tanstack/react-query';
import { Truck, User, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import 'mapbox-gl/dist/mapbox-gl.css';

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
  const mapRef = useRef<any>();
  const [selectedTruck, setSelectedTruck] = React.useState<TruckLocation | null>(null);
  const [viewState, setViewState] = React.useState({
    longitude: -111.8910, // Salt Lake City area
    latitude: 40.7608,
    zoom: 10
  });

  // Fetch truck locations from API
  const { data: truckLocations = [], isLoading } = useQuery<TruckLocation[]>({
    queryKey: ['/api/truck-locations'],
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 25000,
  });

  // Auto-fit map to show all trucks when data loads
  useEffect(() => {
    if (truckLocations.length > 0 && mapRef.current) {
      const coordinates = truckLocations.map(truck => [truck.longitude, truck.latitude]);
      
      if (coordinates.length === 1) {
        // Single truck - center on it
        setViewState(prev => ({
          ...prev,
          longitude: coordinates[0][0],
          latitude: coordinates[0][1],
          zoom: 12
        }));
      } else if (coordinates.length > 1) {
        // Multiple trucks - fit bounds
        const bounds = coordinates.reduce(
          (bounds, coord) => {
            return [
              [Math.min(coord[0], bounds[0][0]), Math.min(coord[1], bounds[0][1])],
              [Math.max(coord[0], bounds[1][0]), Math.max(coord[1], bounds[1][1])]
            ];
          },
          [[coordinates[0][0], coordinates[0][1]], [coordinates[0][0], coordinates[0][1]]]
        );
        
        mapRef.current?.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    }
  }, [truckLocations]);

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
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading truck locations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="h-96 w-full relative">
          <Map
            ref={mapRef}
            {...viewState}
            onMove={(evt: any) => setViewState(evt.viewState)}
            mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
            onClick={() => setSelectedTruck(null)}
          >
            {truckLocations.map((truck) => (
              <Marker
                key={truck.truckId}
                longitude={truck.longitude}
                latitude={truck.latitude}
                anchor="bottom"
                onClick={(e: any) => {
                  e.originalEvent.stopPropagation();
                  setSelectedTruck(truck);
                }}
              >
                <div 
                  className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-pointer hover:scale-110 transition-transform"
                  style={{ 
                    backgroundColor: getMarkerColor(truck.status, truck.currentActivity)
                  }}
                >
                  <Truck className="w-4 h-4 text-white" />
                </div>
              </Marker>
            ))}

            {selectedTruck && (
              <Popup
                longitude={selectedTruck.longitude}
                latitude={selectedTruck.latitude}
                anchor="top"
                onClose={() => setSelectedTruck(null)}
                closeButton={true}
                closeOnClick={false}
                className="truck-popup"
              >
                <div className="p-3 min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="w-4 h-4 text-primary" />
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
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span>{selectedTruck.driverName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs">{selectedTruck.companyName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(selectedTruck.lastUpdateTime)}
                      </span>
                    </div>
                    {selectedTruck.currentActivity && (
                      <div className="mt-2 pt-2 border-t">
                        <span className="text-xs font-medium">
                          Current: {selectedTruck.currentActivity.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            )}
          </Map>
          
          {truckLocations.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
              <div className="text-center">
                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active trucks with GPS data</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}