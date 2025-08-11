import '@/global.css';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getItem } from '@/lib/storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import '../i18n';
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const userStored = await getItem('user');
      setUser(userStored);
      setIsLoading(false);
    })();
  }, []);

  if (!loaded || isLoading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex flex-1'>
        <PaperProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            
            {/* Điều hướng theo trạng thái đăng nhập */}
            {user ? <Redirect href='/(tabs)/home' /> : <Redirect href='/(auth)/login' />}

            {/* Khai báo đầy đủ route */}
            <Stack screenOptions={{headerShown: false}}>
              <Stack.Screen name='(tabs)' />
              <Stack.Screen name='(auth)' />
            </Stack>

            <Toast />
            <StatusBar style='auto' />
          </ThemeProvider>
        </PaperProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
