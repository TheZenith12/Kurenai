import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
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

  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  updateUser: (partial: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (emailOrUsername, password) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login({ emailOrUsername, password }) as any;

          Cookies.set('access_token', data.accessToken, { expires: 1/96 });
          Cookies.set('refresh_token', data.refreshToken, { expires: 7 });

          set({ user: data.user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        const refreshToken = Cookies.get('refresh_token');
        try {
          await authApi.logout(refreshToken ?? '');
        } catch {}

        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        set({ user: null, isAuthenticated: false });
      },

      setUser: (user) => set({ user, isAuthenticated: true }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'anime-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
