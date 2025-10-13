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
  const toRad = Math.PI / 180;
  const lat1 = coord1.latitude * toRad;
  const lon1 = coord1.longitude * toRad;
  const lat2 = coord2.latitude * toRad;
  const lon2 = coord2.longitude * toRad;

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  // THAY ĐỔI DÒNG NÀY ĐỂ KHỚP VỚI JAVA
  const c = 2 * Math.asin(Math.sqrt(a)); 

  const R = 6371; // bán kính Trái Đất (km)
  return formatDistance(R * c * 1.3); // khoảng cách tính theo km
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