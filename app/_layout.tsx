import '@/global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { getItem } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

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
            <Stack screenOptions={{ headerShown: false }}>
              {user ? (
                <Stack.Screen name='(tabs)'/>
              ) : (
                <Stack.Screen name='(auth)'/>
              )}
              {/* <Stack.Screen name='+not-found' /> */}
            </Stack>
            <StatusBar style='auto' />
          </ThemeProvider>
        </PaperProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
