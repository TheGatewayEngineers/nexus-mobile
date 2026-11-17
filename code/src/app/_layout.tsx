import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/auth-provider';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { session, restoring } = useAuth();
  const isSignedIn = !!session;

  // Hold the splash until a saved session is restored, so a signed-in user never sees the landing screen.
  useEffect(() => {
    if (!restoring) SplashScreen.hideAsync();
  }, [restoring]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* auth only redirects to "/", so it must sit behind the signed-out guard too; left unguarded it
          becomes the fallback once index is blocked and the two redirect into each other forever. */}
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
      </Stack.Protected>
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="home" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </ThemeProvider>
  );
}
