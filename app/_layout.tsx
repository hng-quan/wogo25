// RootLayout.tsx
import { ROLE, RoleProvider, useRole } from '@/context/RoleContext';
import '@/global.css';
import '@/i18n';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { ActivityIndicator, PaperProvider, ThemeProvider } from 'react-native-paper';
import 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex flex-1'>
        <RoleProvider>
          <PaperProvider>
            <ThemeProvider>
              <AppNavigator />
              <Toast />
              <StatusBar style='auto' />
            </ThemeProvider>
          </PaperProvider>
        </RoleProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const AppNavigator = () => {
  const {user, role, loading} = useRole();
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    console.log('Loading', loading);
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      console.log('User in AppNavigator:', user);
      console.log('Role in AppNavigator:', role);
      if (!user) {
        setInitialRoute('(auth)');
      } else if (role === ROLE.WORKER) {
        console.log('Navigating to worker tabs');
        setInitialRoute('(tabs-worker)');
      } else {
        setInitialRoute('(tabs-customer)');
      }
    }
  }, [loading, user, role]);

  if (loading || !initialRoute) {
    return (
      <View className='flex-1 justify-center items-center'>
        <ActivityIndicator size='large' />
      </View>
    );
  }

  return (
    <Stack screenOptions={{headerShown: false}} initialRouteName={initialRoute}>
      <Stack.Screen name='(tabs-customer)' />
      <Stack.Screen name='(tabs-worker)' />
      <Stack.Screen name='(auth)' />
    </Stack>
  );
};
