// app/_layout.tsx
import { toastConfig } from '@/components/dialog/ToastConfig';
import { NetworkProvider } from '@/context/NetworkContext';
import { RoleProvider, useRole } from '@/context/RoleContext';
import { SocketProvider } from '@/context/SocketContext';
import { StatusFindJobProvider } from '@/context/StatusFindJobContext';
import '@/global.css';
import '@/i18n';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, ThemeProvider } from 'react-native-paper';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import 'react-native-worklets';

function AppContent() {
  const {user} = useRole();

  if (!user) {
    // chưa login thì chưa cần connect socket
    return <Slot />;
  }

  return (
    <SocketProvider userId={user.id}>
      <StatusFindJobProvider>
        <Slot />
      </StatusFindJobProvider>
    </SocketProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  // const history = useNavigationHistory();

  if (!loaded) return null;

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <SafeAreaView className='flex flex-1'>
          <NetworkProvider>
            <RoleProvider>
              <PaperProvider>
                <ThemeProvider>
                  <AppContent />
                  {/* {history.length > 0 && <>{console.log('📜 History stack:', history)}</>} */}
                  <Toast config={toastConfig} topOffset={0} />
                  <StatusBar style='auto' />
                </ThemeProvider>
              </PaperProvider>
            </RoleProvider>
          </NetworkProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
