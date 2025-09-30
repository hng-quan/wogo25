import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { ensureLocationEnabled } from "./useLocation";

export function useSafeCurrentLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    (async () => {
      const enabled = await ensureLocationEnabled();
      if (!enabled) return;

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    })();
  }, []);

  return location;
}
