import { ensureLocationEnabled } from '@/hooks/useLocation';
import * as Location from 'expo-location';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Interface for location coordinates
 */
interface LocationCoords {
  latitude: number;
  longitude: number;
}

/**
 * Interface for location context state
 */
interface LocationContextType {
  /** Current user location coordinates */
  location: LocationCoords | null;
  /** Loading state for location fetching */
  isLoading: boolean;
  /** Error message if location fetch fails */
  error: string | null;
  /** Timestamp of last successful location update */
  lastUpdated: Date | null;
  /** Manual refresh location */
  refreshLocation: () => Promise<void>;
  /** Check if location is valid and not default coordinates */
  isValidLocation: (coords: LocationCoords | null) => boolean;
}

/**
 * Default context value
 */
const defaultValue: LocationContextType = {
  location: null,
  isLoading: false,
  error: null,
  lastUpdated: null,
  refreshLocation: async () => {},
  isValidLocation: () => false,
};

/**
 * Location context for global location state management
 */
const LocationContext = createContext<LocationContextType>(defaultValue);

/**
 * Props for LocationProvider component
 */
interface LocationProviderProps {
  children: React.ReactNode;
}

/**
 * Location Provider component
 * Provides global location state management across the app
 * - Fetches location on app startup
 * - Refreshes when app comes back from background
 * - Handles permissions and GPS enablement
 * - Provides loading and error states
 */
export function LocationProvider({children}: LocationProviderProps) {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const appState = useRef(AppState.currentState);
  const fetchingRef = useRef(false); // Prevent concurrent fetches
  const lastUpdatedRef = useRef(lastUpdated);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  /**
   * Validates if coordinates are valid and not default values
   * @param coords - Location coordinates to validate
   * @returns boolean indicating if coordinates are valid
   */
  const isValidLocation = (coords: LocationCoords | null): boolean => {
    if (!coords) return false;

    const {latitude, longitude} = coords;

    // Check if coordinates are numbers
    if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;

    // Check for invalid ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return false;

    // Avoid default 0,0 coordinates (middle of ocean)
    const nearZero = Math.abs(latitude) < 1e-6 && Math.abs(longitude) < 1e-6;

    return !nearZero;
  };

  /**
   * Fetches current location from device GPS
   * Handles permissions, GPS enablement, and error states
   */
  // const fetchCurrentLocation = async (): Promise<void> => {
  //   // Prevent concurrent fetch operations
  //   if (fetchingRef.current) {
  //     console.log('🔄 Location fetch already in progress, skipping...');
  //     return;
  //   }

  //   try {
  //     fetchingRef.current = true;
  //     setIsLoading(true);
  //     setError(null);

  //     // console.log('🎯 Starting location fetch process...');

  //     // Check and request permissions + GPS
  //     const isEnabled = await ensureLocationEnabled();
  //     if (!isEnabled) {
  //       throw new Error('Không thể truy cập vị trí. Vui lòng kiểm tra quyền và GPS.');
  //     }

  //     // Get current location with high accuracy
  //     const locationResult = await Location.getCurrentPositionAsync({
  //       accuracy: Location.Accuracy.High,
  //       // maximumAge: 30000, // Use cached location if less than 30 seconds old
  //       // timeout: 15000, // Timeout after 15 seconds
  //     });

  //     const newLocation: LocationCoords = {
  //       latitude: locationResult.coords.latitude,
  //       longitude: locationResult.coords.longitude,
  //     };

  //     // Validate fetched location
  //     if (!isValidLocation(newLocation)) {
  //       throw new Error('Vị trí không hợp lệ. Vui lòng thử lại.');
  //     }

  //     // Update state with new location
  //     setLocation(newLocation);
  //     setLastUpdated(new Date());
  //     setError(null);

  //     console.log('✅ [DEVICE] initial location success:', newLocation);
  //   } catch (fetchError) {
  //     const errorMessage = fetchError instanceof Error ? fetchError.message : 'Lỗi không xác định khi lấy vị trí';

  //     console.log('❌ [DEVICE] initial location failed:', errorMessage);
  //     setError(errorMessage);

  //     // Keep existing location if available
  //     if (!location) {
  //       setLocation(null);
  //     }
  //   } finally {
  //     setIsLoading(false);
  //     fetchingRef.current = false;
  //   }
  // };

  const startLocationTracking = async (): Promise<void> => {
    if (fetchingRef.current) {
      console.log('🔄 Tracking start already in progress, skipping...');
      return;
    }

    try {
      fetchingRef.current = true;
      setIsLoading(true);
      setError(null);

      const isEnabled = await ensureLocationEnabled();
      if (!isEnabled) {
        throw new Error('Không thể truy cập vị trí. Vui lòng kiểm tra quyền và GPS.');
      }

      // 1. Dừng theo dõi cũ (nếu có)
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
        console.log('🛑 Stopped previous tracking subscription.');
      }

      // 2. Bắt đầu theo dõi vị trí liên tục
      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 5, // Cập nhật khi di chuyển 5 mét
          // timeInterval: 5000, // Hoặc sau mỗi 5 giây
        },
        locationResult => {
          const newLocation: LocationCoords = {
            latitude: locationResult.coords.latitude,
            longitude: locationResult.coords.longitude,
          };

          // Cập nhật State nếu vị trí hợp lệ
          if (isValidLocation(newLocation)) {
            setLocation(newLocation);
            setLastUpdated(new Date()); // Cập nhật state (kích hoạt re-render)
            setIsLoading(false);
            console.log('✅ [DEVICE] location updated:', newLocation);
          } else {
            console.log('⚠️ [DEVICE] Received invalid location data.');
          }
        },
      );
      console.log('✅ Location tracking started successfully.');
    } catch (trackError) {
      const errorMessage = trackError instanceof Error ? trackError.message : 'Lỗi không xác định khi theo dõi vị trí';
      console.log('❌ [DEVICE] location tracking failed:', errorMessage);
      setError(errorMessage);
      if (!location) setLocation(null);
      setIsLoading(false);
    } finally {
      // Reset fetchingRef để cho phép gọi lại nếu cần
      fetchingRef.current = false;
    }
  };
  /**
   * Manual refresh function for components to trigger location update
   */
  // const refreshLocation = async (): Promise<void> => {
  //   await fetchCurrentLocation();
  // };
  const refreshLocation = async (): Promise<void> => {
    await startLocationTracking();
  };

  /**
   * Handle app state changes
   * Refresh location when app comes back from background
   */
  useEffect(() => {
    // Initial location fetch on mount
    console.log('lastUpdated', lastUpdated);
    // fetchCurrentLocation();
    startLocationTracking();

    // Listen for app state changes
    const subscription = AppState.addEventListener('change', nextAppState => {
      const wasInBackground = appState.current.match(/inactive|background/);
      const isNowActive = nextAppState === 'active';

      if (wasInBackground && isNowActive) {
        console.log('📱 App returned from background, refreshing location...');

        const currentLastUpdated = lastUpdatedRef.current;
        // Only refresh if last update was more than 5 minutes ago
        const shouldRefresh = !currentLastUpdated || Date.now() - currentLastUpdated.getTime() > 5 * 60 * 1000;

        if (shouldRefresh) {
          // fetchCurrentLocation();
          startLocationTracking();
        } else {
          console.log('📍 Location is still fresh, skipping refresh');
        }
      }

      appState.current = nextAppState;
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.remove();
      if (locationSubscription.current) {
        console.log('🛑 Stopping final location tracking...');
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, []);

  useEffect(() => {
    lastUpdatedRef.current = lastUpdated;
  }, [lastUpdated]);

  /**
   * Context value object
   */
  const contextValue: LocationContextType = {
    location,
    isLoading,
    error,
    lastUpdated,
    refreshLocation,
    isValidLocation,
  };

  return <LocationContext.Provider value={contextValue}>{children}</LocationContext.Provider>;
}

/**
 * Hook to use location context
 * @returns LocationContextType object with location state and methods
 */
export function useLocation(): LocationContextType {
  const context = useContext(LocationContext);

  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }

  return context;
}

/**
 * Hook to get just the location coordinates (for backward compatibility)
 * @returns LocationCoords or null
 */
export function useCurrentLocation(): LocationCoords | null {
  const {location} = useLocation();
  return location;
}

/**
 * Hook to check if location is ready and valid
 * @returns boolean indicating if location is ready to use
 */
export function useLocationReady(): boolean {
  const {location, isLoading, isValidLocation} = useLocation();
  return !isLoading && isValidLocation(location);
}
