import { View, Text, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Bangers_400Regular } from '@expo-google-fonts/bangers';
import { BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import {
  Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_900Black,
} from '@expo-google-fonts/inter';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { AppBackground } from '../components/AppBackground';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 30_000 } },
});

// Inter-г бүх Text/TextInput-ийн default font болгох (web body шиг)
function applyDefaultFont() {
  const TAny = Text as any;
  const TIAny = TextInput as any;
  TAny.defaultProps = TAny.defaultProps || {};
  TAny.defaultProps.style = [{ fontFamily: 'Inter_400Regular' }, TAny.defaultProps.style];
  TIAny.defaultProps = TIAny.defaultProps || {};
  TIAny.defaultProps.style = [{ fontFamily: 'Inter_400Regular' }, TIAny.defaultProps.style];
}

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
  const [loaded] = useFonts({
    Bangers_400Regular,
    BebasNeue_400Regular,
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_900Black,
  });

  if (loaded) applyDefaultFont();

  // Fonts ачаалагдтал хар дэлгэц (logo flash-аас сэргийлнэ)
  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: '#020008' }} />;
  }

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
