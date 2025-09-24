// app/_layout.tsx
import { NetworkProvider } from '@/context/NetworkContext';
import { RoleProvider } from '@/context/RoleContext';
import '@/global.css';
import '@/i18n';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, ThemeProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import 'react-native-worklets';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  // const history = useNavigationHistory();

  if (!loaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex flex-1'>
        <NetworkProvider>
          <RoleProvider>
            <PaperProvider>             
              <ThemeProvider>
                <Slot />
                {/* Debug */}
                {/* {history.length > 0 && <>{console.log('📜 History stack:', history)}</>} */}
                <Toast />
                <StatusBar style='auto' />
              </ThemeProvider>
            </PaperProvider>
          </RoleProvider>
        </NetworkProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
