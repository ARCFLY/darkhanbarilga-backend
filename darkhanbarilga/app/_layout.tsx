import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/authStore';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { loadUser } = useAuthStore();

  useEffect(() => {
    loadUser().finally(() => SplashScreen.hideAsync());
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="property/[id]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="admin/dashboard" />
          <Stack.Screen name="agent/listings" />
          <Stack.Screen name="agent/profile-edit" />
        </Stack>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
