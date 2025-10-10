import * as Location from "expo-location";
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { ensureLocationEnabled } from "./useLocation";

export function useSafeCurrentLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const appState = useRef(AppState.currentState);

  // Tách logic kiểm tra ra một hàm riêng để có thể gọi lại
  const checkAndFetchLocation = async () => {
    console.log("🚀 Bắt đầu kiểm tra vị trí và quyền...");
    const enabled = await ensureLocationEnabled();
    if (!enabled) {
      console.log("🛑 Kiểm tra thất bại, vị trí hoặc quyền chưa sẵn sàng.");
      return; // Dừng lại nếu quyền/GPS chưa được bật
    }

    try {
      // Chỉ lấy vị trí nếu đã có đủ quyền và GPS
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High, // Yêu cầu độ chính xác cao hơn
      });
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      console.log('✅ Lấy vị trí thành công:', currentLocation.coords);
    } catch (error) {
        console.error("Lỗi khi lấy vị trí hiện tại:", error);
    }
  };

  useEffect(() => {
    // 1. Chạy lần đầu khi component mount
    checkAndFetchLocation();

    // 2. Lắng nghe sự kiện thay đổi trạng thái của app
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      // Nếu app từ nền (background) trở lại hoạt động (active)
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        console.log("📲 App đã quay trở lại! Kiểm tra lại vị trí.");
        checkAndFetchLocation(); // Chạy lại quy trình kiểm tra
      }
      appState.current = nextAppState;
    });

    // 3. Dọn dẹp listener khi component unmount
    return () => {
      subscription.remove();
    };
  }, []); // Vẫn giữ mảng rỗng để chỉ setup 1 lần

  return location;
}


// version: 1
// import * as Location from "expo-location";
// import { useEffect, useState } from "react";
// import { ensureLocationEnabled } from "./useLocation";

// export function useSafeCurrentLocation() {
//   const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

//   useEffect(() => {
//     (async () => {
//       const enabled = await ensureLocationEnabled();
//       if (!enabled) return;

//       const currentLocation = await Location.getCurrentPositionAsync({});
//       setLocation({
//         latitude: currentLocation.coords.latitude,
//         longitude: currentLocation.coords.longitude,
//       });
//     })();
//   }, []);

//   return location;
// }


