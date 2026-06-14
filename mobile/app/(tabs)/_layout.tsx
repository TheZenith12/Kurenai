import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/theme';
import { useAuthStore } from '../../store/auth.store';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: '🏠', chat: '💬', attack: '⚔️', games: '🎮', gacha: '✨', more: '☰',
  };
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      {focused && (
        <LinearGradient
          colors={colors.gradient}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      )}
      <Text style={styles.tabEmoji}>{icons[name] ?? '●'}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  // Wait for persisted auth to load before deciding — prevents login flash on cold start
  if (!hasHydrated) return <View style={{ flex: 1 }} />;
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        sceneStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{ title: 'Нүүр', tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: 'Чат', tabBarIcon: ({ focused }) => <TabIcon name="chat" focused={focused} /> }}
      />
      <Tabs.Screen
        name="attack"
        options={{ title: 'PvP', tabBarIcon: ({ focused }) => <TabIcon name="attack" focused={focused} /> }}
      />
      <Tabs.Screen
        name="games"
        options={{ title: 'Тоглоом', tabBarIcon: ({ focused }) => <TabIcon name="games" focused={focused} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: 'Дэлгэрэнгүй', tabBarIcon: ({ focused }) => <TabIcon name="more" focused={focused} /> }}
      />
      {/* Gacha хадгалагдсан хэвээр — tab bar-аас нуусан, More цэс / Home-оос хандана */}
      <Tabs.Screen name="gacha" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bgCard,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: 8,
  },
  tabLabel: { fontSize: 10, fontWeight: '600' },
  tabIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  tabIconActive: { borderRadius: 20 },
  tabEmoji: { fontSize: 18 },
});
