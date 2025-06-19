import { useState, useEffect, useCallback } from "react";
import { 
  getCurrentPosition, 
  watchPosition, 
  clearWatch,
  isGeolocationSupported,
  type GeolocationPosition,
  type GeolocationError,
  DEFAULT_GEOLOCATION_OPTIONS
} from "@/lib/gps";

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

interface UseGeolocationReturn {
  location: GeolocationPosition["coords"] | null;
  error: GeolocationError | null;
  isLoading: boolean;
  isSupported: boolean;
  requestLocation: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing geolocation in the TerraFirma app
 */
export function useGeolocation(options: UseGeolocationOptions = {}): UseGeolocationReturn {
  const [location, setLocation] = useState<GeolocationPosition["coords"] | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);

  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 30000,
    watch = false,
  } = options;

  const geolocationOptions: PositionOptions = {
    enableHighAccuracy,
    timeout,
    maximumAge,
  };

  const isSupported = isGeolocationSupported();

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setLocation(position.coords);
    setError(null);
    setIsLoading(false);
  }, []);

  const handleError = useCallback((error: GeolocationError) => {
    setError(error);
    setLocation(null);
    setIsLoading(false);
  }, []);

  const requestLocation = useCallback(async () => {
    if (!isSupported) {
      setError({
        code: -1,
        message: "Geolocation is not supported by this browser",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await getCurrentPosition(geolocationOptions);
      handleSuccess(position);
    } catch (err) {
      handleError(err as GeolocationError);
    }
  }, [isSupported, geolocationOptions, handleSuccess, handleError]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Start watching position if watch option is enabled
  useEffect(() => {
    if (!watch || !isSupported) {
      return;
    }

    setIsLoading(true);
    
    const id = watchPosition(
      handleSuccess,
      handleError,
      geolocationOptions
    );

    if (id !== null) {
      setWatchId(id);
    } else {
      setIsLoading(false);
    }

    return () => {
      if (id !== null) {
        clearWatch(id);
      }
    };
  }, [watch, isSupported, handleSuccess, handleError, geolocationOptions]);

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Request location on mount if not watching
  useEffect(() => {
    if (!watch && isSupported) {
      requestLocation();
    }
  }, [watch, isSupported, requestLocation]);

  return {
    location,
    error,
    isLoading,
    isSupported,
    requestLocation,
    clearError,
  };
}

/**
 * Hook for one-time geolocation requests
 */
export function useGeolocationOnce(options: Omit<UseGeolocationOptions, "watch"> = {}) {
  return useGeolocation({ ...options, watch: false });
}

/**
 * Hook for continuous geolocation watching
 */
export function useGeolocationWatch(options: Omit<UseGeolocationOptions, "watch"> = {}) {
  return useGeolocation({ ...options, watch: true });
}

/**
 * Hook to check geolocation permission status
 */
export function useGeolocationPermission() {
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkPermission = useCallback(async () => {
    if (!("permissions" in navigator)) {
      return;
    }

    setIsLoading(true);
    
    try {
      const permission = await navigator.permissions.query({ name: "geolocation" });
      setPermissionState(permission.state);
      
      // Listen for permission changes
      permission.addEventListener("change", () => {
        setPermissionState(permission.state);
      });
    } catch (error) {
      console.warn("Failed to check geolocation permission:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    permissionState,
    isLoading,
    isGranted: permissionState === "granted",
    isDenied: permissionState === "denied",
    isPrompt: permissionState === "prompt",
    checkPermission,
  };
}
