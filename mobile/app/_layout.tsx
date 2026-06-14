import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { AppBackground } from '../components/AppBackground';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30_000 } },
});

// Transparent navigation theme so the global AppBackground shows on every screen
const NavTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: 'transparent', card: 'transparent' },
};

function AppInner() {
  usePushNotifications();
  return (
    <View style={{ flex: 1, backgroundColor: '#020008' }}>
      {/* Global background — identical look to the web dashboard */}
      <AppBackground />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="index" />
        <Stack.Screen name="landing" />
        <Stack.Screen name="guild-wars/index" />
        <Stack.Screen name="notifications/index" />
        <Stack.Screen name="search/index" />
        <Stack.Screen name="watchlist/index" />
        <Stack.Screen name="seasons/index" />
        <Stack.Screen name="activity/index" />
        <Stack.Screen name="user/[id]" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#020008' }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider value={NavTheme}>
            <StatusBar style="light" backgroundColor="transparent" translucent />
            <AppInner />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
