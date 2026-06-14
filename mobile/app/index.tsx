import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth.store';

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  // Wait for persisted auth before deciding — avoids landing flash for logged-in users
  if (!hasHydrated) return <View style={{ flex: 1, backgroundColor: '#020008' }} />;

  if (isAuthenticated) return <Redirect href="/(tabs)/home" />;
  return <Redirect href="/landing" />;
}
