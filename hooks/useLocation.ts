import * as IntentLauncher from 'expo-intent-launcher';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';

export async function ensureLocationEnabled(): Promise<boolean> {
  try {
    let { status, canAskAgain } = await Location.getForegroundPermissionsAsync();

    // Nếu chưa được cấp quyền và vẫn có thể hỏi lại -> xin quyền
    if (status !== 'granted' && canAskAgain) {
      const { status: newStatus, canAskAgain: newCanAskAgain } =
        await Location.requestForegroundPermissionsAsync();

      status = newStatus;
      canAskAgain = newCanAskAgain;
    }

    if (status !== 'granted') {
      // Nếu không thể hỏi lại -> thông báo mở Settings
      if (!canAskAgain) {
        Alert.alert(
          'Quyền định vị bị tắt',
          'Bạn đã từ chối quyền định vị. Vui lòng bật lại trong Cài đặt để tiếp tục.',
          [
            {
              text: 'Mở Cài đặt',
              onPress: () => Linking.openSettings(),
            },
            { text: 'Hủy', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Yêu cầu quyền định vị', 'Bạn cần bật quyền định vị để tiếp tục.');
      }
      return false;
    }

    // Kiểm tra dịch vụ GPS
    const isServiceEnabled = await Location.hasServicesEnabledAsync();
    if (!isServiceEnabled) {
      return new Promise((resolve) => {
        Alert.alert('Bật GPS', 'Vui lòng bật GPS để tiếp tục.', [
          {
            text: 'Bật ngay',
            onPress: async () => {
              if (Platform.OS === 'android') {
                await IntentLauncher.startActivityAsync(
                  IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS
                );
              } else {
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
