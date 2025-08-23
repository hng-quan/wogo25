// app/index.tsx
import { ROLE, useRole } from '@/context/RoleContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AppState, View } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

export default function Index() {
  const {user, role, loading} = useRole();
  const router = useRouter();

  useEffect(() => {
    const handleNavigation = () => {
      if (!loading) {
        console.log('Loading complete');
        console.log('User in Index:', user);
        console.log('Role in Index:', role);

        if (!user) {
          router.replace('/(auth)/login');
        } else if (role === ROLE.WORKER) {
          router.replace('/(tabs-worker)');
        } else {
          router.replace('/(tabs-customer)');
        }
      }
    };

    handleNavigation(); // Gọi ngay khi useEffect chạy

    // Xử lý khi ứng dụng quay lại từ background
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && !loading) {
        console.log('App is active, checking route...');
        handleNavigation();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [loading, user, role, router]);

  if (loading) {
    return (
      <View className='flex-1 justify-center items-center'>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  return null; // Không render gì, vì điều hướng đã được xử lý
}
