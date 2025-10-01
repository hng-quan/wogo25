import * as Location from "expo-location";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export async function getCurrentLocation(): Promise<Coordinates | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.warn("Permission to access location was denied");
      return null;
    }

    const currentLocation = await Location.getCurrentPositionAsync({});
    return {
      latitude: currentLocation.coords.latitude,
      longitude: currentLocation.coords.longitude,
    };
  } catch (error) {
    console.error("getCurrentLocation error:", error);
    return null;
  }
}

/**
 * Tính khoảng cách giữa 2 tọa độ (theo km)
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): string {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const R = 6371; // Bán kính Trái Đất (km)
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const lat1 = toRad(coord1.latitude);
  const lat2 = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) *
    Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return formatDistance(R * c); // Khoảng cách (km)
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`; // bạn có thể đổi thành .toFixed(2) nếu muốn chi tiết hơn
}

export function metersToKm(meters: number, fractionDigits: number = 2): string {
  const km = meters / 1000;
  return `${km.toFixed(fractionDigits)} km`;
}