import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../lib/api';

interface User {
  id: string;
  username: string;
  displayName: string | null;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  reputation: number;
  characterPoints: number;
  activeCharacterId: string | null;
  email?: string;
  isEmailVerified?: boolean;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  guest: boolean;
  _hasHydrated: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  loginGuest: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  updateUser: (partial: Partial<User>) => void;
}

const GUEST_USER: User = {
  id: 'guest',
  username: 'Guest',
  displayName: 'Зочин',
  role: 'USER',
  reputation: 0,
  characterPoints: 0,
  activeCharacterId: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      guest: false,
      _hasHydrated: false,

      login: async (emailOrUsername, password) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login({ emailOrUsername, password }) as any;
          await SecureStore.setItemAsync('access_token', data.accessToken);
          await SecureStore.setItemAsync('refresh_token', data.refreshToken);
          set({ user: data.user, isAuthenticated: true, guest: false });
        } finally {
          set({ isLoading: false });
        }
      },

      loginGuest: async () => {
        set({ user: GUEST_USER, isAuthenticated: true, guest: true });
      },

      logout: async () => {
        try {
          const rt = await SecureStore.getItemAsync('refresh_token');
          await authApi.logout(rt ?? '');
        } catch {}
        await SecureStore.deleteItemAsync('access_token').catch(() => {});
        await SecureStore.deleteItemAsync('refresh_token').catch(() => {});
        set({ user: null, isAuthenticated: false, guest: false });
      },

      setUser: (user) => set({ user, isAuthenticated: true, guest: false }),
      updateUser: (partial) =>
        set((state) => ({ user: state.user ? { ...state.user, ...partial } : null })),
    }),
    {
      name: 'kurenai-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated, guest: state.guest }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ _hasHydrated: true });
      },
    },
  ),
);
