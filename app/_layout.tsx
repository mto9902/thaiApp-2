import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { GrammarCatalogProvider } from '@/src/grammar/GrammarCatalogProvider';
import { SubscriptionProvider } from '@/src/subscription/SubscriptionProvider';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const isAuthPath =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/auth/');

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <SubscriptionProvider authRefreshKey={isAuthPath ? 'auth' : 'app'}>
        <GrammarCatalogProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
            <Stack.Screen
              name="premium"
              options={{ headerShown: false, presentation: 'modal' }}
            />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </GrammarCatalogProvider>
      </SubscriptionProvider>
    </ThemeProvider>
  );
}
