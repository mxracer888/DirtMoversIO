/**
 * GPS and Geolocation utilities for TerraFirma app
 */

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
}

export interface GeolocationPosition {
  coords: GeolocationCoordinates;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

export const GEOLOCATION_ERROR_CODES = {
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
} as const;

export const GEOLOCATION_ERROR_MESSAGES = {
  [GEOLOCATION_ERROR_CODES.PERMISSION_DENIED]: 
    "Location access denied. Please enable location services in your browser settings.",
  [GEOLOCATION_ERROR_CODES.POSITION_UNAVAILABLE]: 
    "Location information is unavailable. Please check your GPS signal.",
  [GEOLOCATION_ERROR_CODES.TIMEOUT]: 
    "Location request timed out. Please try again.",
} as const;

/**
 * Default options for geolocation requests
 */
export const DEFAULT_GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000, // 10 seconds
  maximumAge: 30000, // 30 seconds
};

/**
 * Check if geolocation is supported by the browser
 */
export function isGeolocationSupported(): boolean {
  return "geolocation" in navigator;
}

/**
 * Get current position with Promise-based API
 */
export function getCurrentPosition(
  options: PositionOptions = DEFAULT_GEOLOCATION_OPTIONS
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error("Geolocation is not supported by this browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
          },
          timestamp: position.timestamp,
        });
      },
      (error) => {
        const message = GEOLOCATION_ERROR_MESSAGES[error.code as keyof typeof GEOLOCATION_ERROR_MESSAGES] 
          || "An unknown error occurred while retrieving location";
        
        reject({
          code: error.code,
          message,
        });
      },
      options
    );
  });
}

/**
 * Watch position changes with Promise-based API
 */
export function watchPosition(
  onSuccess: (position: GeolocationPosition) => void,
  onError: (error: GeolocationError) => void,
  options: PositionOptions = DEFAULT_GEOLOCATION_OPTIONS
): number | null {
  if (!isGeolocationSupported()) {
    onError({
      code: -1,
      message: "Geolocation is not supported by this browser",
    });
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
        },
        timestamp: position.timestamp,
      });
    },
    (error) => {
      const message = GEOLOCATION_ERROR_MESSAGES[error.code as keyof typeof GEOLOCATION_ERROR_MESSAGES] 
        || "An unknown error occurred while retrieving location";
      
      onError({
        code: error.code,
        message,
      });
    },
    options
  );
}

/**
 * Clear position watch
 */
export function clearWatch(watchId: number): void {
  if (isGeolocationSupported()) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Calculate distance between two coordinates in meters
 * Uses the Haversine formula
 */
export function calculateDistance(
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(
  coords: { latitude: number; longitude: number },
  precision: number = 4
): string {
  return `${coords.latitude.toFixed(precision)}, ${coords.longitude.toFixed(precision)}`;
}

/**
 * Check if coordinates are within a reasonable range
 */
export function validateCoordinates(coords: { latitude: number; longitude: number }): boolean {
  return (
    coords.latitude >= -90 &&
    coords.latitude <= 90 &&
    coords.longitude >= -180 &&
    coords.longitude <= 180 &&
    !isNaN(coords.latitude) &&
    !isNaN(coords.longitude)
  );
}

/**
 * Request permission for geolocation (for browsers that support it)
 */
export async function requestLocationPermission(): Promise<PermissionState> {
  if (!("permissions" in navigator)) {
    throw new Error("Permissions API not supported");
  }

  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    return permission.state;
  } catch (error) {
    throw new Error("Failed to query geolocation permission");
  }
}
