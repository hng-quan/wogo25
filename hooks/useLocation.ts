import * as IntentLauncher from 'expo-intent-launcher';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export async function ensureLocationEnabled(): Promise<boolean> {
  try {
    // 1. Kiểm tra & yêu cầu quyền
    let { status } = await Location.getForegroundPermissionsAsync();

    if (status !== 'granted') {
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      status = newStatus;
    }

    if (status !== 'granted') {
      Alert.alert('Yêu cầu quyền định vị', 'Bạn cần bật quyền định vị để tiếp tục.');
      return false;
    }

    // 2. Kiểm tra dịch vụ GPS đã bật chưa
    const isServiceEnabled = await Location.hasServicesEnabledAsync();
    if (!isServiceEnabled) {
      return new Promise<boolean>((resolve) => {
        Alert.alert('Bật GPS', 'Vui lòng bật GPS để tiếp tục.', [
          {
            text: 'Bật ngay',
            onPress: async () => {
              if (Platform.OS === 'android') {
                try {
                  await IntentLauncher.startActivityAsync(
                    IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS
                  );
                } catch (e) {
                  console.warn('Không mở được Location Settings', e);
                  Linking.openSettings();
                }
              } else {
                // iOS không cho bật trực tiếp -> mở Settings
                Linking.openURL('App-Prefs:Privacy&path=LOCATION');
              }
              resolve(false);
            },
          },
          { text: 'Hủy', style: 'cancel', onPress: () => resolve(false) },
        ]);
      });
    }

    return true;
  } catch (err) {
    console.error('Lỗi kiểm tra GPS:', err);
    return false;
  }
}
