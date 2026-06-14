import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { pushApi } from '../lib/api';
import { useAuthStore } from '../store/auth.store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const { isAuthenticated } = useAuthStore();
  const registered = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || registered.current) return;

    (async () => {
      // Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Kurenai',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#DC2626',
        });
      }

      // Ask permission
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      // Get token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      if (!token) return;

      // Send to backend
      await pushApi.saveToken(token).catch(() => {});
      registered.current = true;
    })();
  }, [isAuthenticated]);
}
