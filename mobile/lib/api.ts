import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3001/api/v1';

async function getToken(key: string): Promise<string | null> {
  try { return await SecureStore.getItemAsync(key); } catch { return null; }
}
async function setToken(key: string, value: string) {
  try { await SecureStore.setItemAsync(key, value); } catch {}
}
async function removeToken(key: string) {
  try { await SecureStore.deleteItemAsync(key); } catch {}
}

export const tokenStorage = { getToken, setToken, removeToken };

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(async (config) => {
      const token = await getToken('access_token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token) => {
                original.headers.Authorization = `Bearer ${token}`;
                resolve(this.client(original));
              });
            });
          }
          original._retry = true;
          this.isRefreshing = true;
          try {
            const refreshToken = await getToken('refresh_token');
            if (!refreshToken) throw new Error('No refresh token');
            const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
            await setToken('access_token', data.accessToken);
            await setToken('refresh_token', data.refreshToken);
            this.refreshSubscribers.forEach((cb) => cb(data.accessToken));
            this.refreshSubscribers = [];
            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return this.client(original);
          } catch {
            await removeToken('access_token');
            await removeToken('refresh_token');
            router.replace('/(auth)/login');
            return Promise.reject(error);
          } finally {
            this.isRefreshing = false;
          }
        }
        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.get<T>(url, config);
    return data;
  }
  async post<T>(url: string, body?: object, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.post<T>(url, body, config);
    return data;
  }
  async put<T>(url: string, body?: object, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.put<T>(url, body, config);
    return data;
  }
  async patch<T>(url: string, body?: object, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.patch<T>(url, body, config);
    return data;
  }
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await this.client.delete<T>(url, config);
    return data;
  }
}

export const api = new ApiClient();

export const authApi = {
  register: (data: { email: string; username: string; password: string; displayName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { emailOrUsername: string; password: string }) =>
    api.post<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', data),
  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),
  forgotPassword: (emailOrUsername: string) =>
    api.post<{ message: string; devCode?: string }>('/auth/forgot-password', { emailOrUsername }),
  resetPassword: (resetCode: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/reset-password', { resetCode, newPassword }),
};

export const characterApi = {
  getAnimes: () => api.get<any[]>('/characters/animes'),
  getMyCharacters: () => api.get<any[]>('/characters/my'),
  selectFree: (characterId: string) => api.post('/characters/select-free', { characterId }),
  setActive: (userCharacterId: string) => api.post('/characters/set-active', { userCharacterId }),
};

export const chatApi = {
  getRoomMessages: (roomId: string, limit = 50) =>
    api.get<any[]>(`/chat/rooms/${roomId}/messages?limit=${limit}`),
  getMyAnimeRooms: () => api.get<any[]>('/chat/my-anime-rooms'),
  getMyPrivateRooms: () => api.get<any[]>('/chat/my-private-rooms'),
  createPrivateRoom: (userId: string) => api.post<any>('/chat/private', { userId }),
  deleteMessage: (messageId: string) => api.delete(`/chat/messages/${messageId}`),
  uploadImage: async (uri: string): Promise<{ url: string }> => {
    const token = await getToken('access_token');
    const formData = new FormData();
    formData.append('file', { uri, name: 'image.jpg', type: 'image/jpeg' } as any);
    const res = await fetch(`${API_URL}/chat/upload/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Upload амжилтгүй');
    return res.json();
  },
};

export const attackApi = {
  attack: (defenderId: string, skillId: string) =>
    api.post<any>('/attack/perform', { defenderId, skillId }),
  getLeaderboard: () => api.get<any[]>('/attack/leaderboard'),
  getMyStats: () => api.get<any>('/attack/my-stats'),
  getHistory: () => api.get<any[]>('/attack/history'),
};

export const seasonApi = {
  getCurrent: () => api.get<any>('/seasons/current'),
  getHistory: () => api.get<any[]>('/seasons/history'),
};

export const gameApi = {
  getGames: () => api.get<any[]>('/games'),
  startGame: (gameId: string) => api.post<any>('/games/start', { gameId }),
  endGame: (data: { sessionToken: string; score: number; duration: number }) =>
    api.post<any>('/games/end', data),
  getLeaderboard: (gameId: string) => api.get<any[]>(`/games/${gameId}/leaderboard`),
  getMyStats: () => api.get<any>('/games/my-stats'),
};

export const leaderboardApi = {
  getAttack: (limit?: number) => api.get<any[]>(`/leaderboard/attack?limit=${limit ?? 50}`),
  getMiniGame: (period?: string) =>
    api.get<any[]>(`/leaderboard/mini-game?period=${period ?? 'daily'}`),
  getGuild: () => api.get<any[]>('/leaderboard/guild'),
  getMyRanks: () => api.get<any>('/leaderboard/my-ranks'),
};

export const achievementsApi = {
  getAll: () => api.get<any[]>('/achievements'),
  getMy: () => api.get<any[]>('/achievements/my'),
  claim: (achievementId: string) => api.post<any>(`/achievements/claim/${achievementId}`),
};

export const notificationsApi = {
  getAll: (limit?: number) => api.get<any[]>(`/notifications?limit=${limit ?? 30}`),
  getUnreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => api.post<any>(`/notifications/${id}/read`),
  markAllRead: () => api.post<any>('/notifications/read-all'),
};

export const gachaApi = {
  getPools: () => api.get<any[]>('/gacha/pools'),
  getPity: (poolId: string) => api.get<{ pity: number }>(`/gacha/pity/${poolId}`),
  roll: (poolId: string, count: 1 | 10) => api.post<any[]>(`/gacha/roll/${poolId}`, { count }),
};

export const guildApi = {
  getMyGuild: () => api.get<any>('/guilds/my'),
  joinGuild: (guildId: string) => api.post('/guilds/join', { guildId }),
  leaveGuild: () => api.post('/guilds/leave'),
  getLeaderboard: () => api.get<any[]>('/leaderboard/guild'),
  createGuild: (data: { name: string; description?: string; animeId: string }) =>
    api.post<any>('/guilds', data),
  updateGuild: (data: { name?: string; description?: string }) => api.patch<any>('/guilds', data),
  promoteMember: (targetUserId: string, role: string) =>
    api.post<any>('/guilds/promote', { targetUserId, role }),
};

export const usersApi = {
  getMe: () => api.get<any>('/users/me'),
  getProfile: (userId: string) => api.get<any>(`/users/${userId}`),
  search: (q: string) => api.get<any[]>(`/users/search?q=${encodeURIComponent(q)}`),
};

export const cosmeticsApi = {
  getAll: () => api.get<any[]>('/cosmetics'),
  getMy: () => api.get<any[]>('/cosmetics/my'),
  getEquipped: () => api.get<any[]>('/cosmetics/equipped'),
  buy: (itemId: string) => api.post<any>(`/cosmetics/buy/${itemId}`),
  equip: (itemId: string) => api.post<any>(`/cosmetics/equip/${itemId}`),
  unequip: (itemId: string) => api.post<any>(`/cosmetics/unequip/${itemId}`),
};

export const questsApi = {
  getToday: () => api.get<any[]>('/quests/today'),
  claim: (questId: string) => api.post<any>(`/quests/claim/${questId}`),
};

export const watchlistApi = {
  getAll: () => api.get<any[]>('/users/me/watchlist'),
  add: (animeId: string, status?: string) => api.post<any>('/users/me/watchlist', { animeId, status }),
  remove: (animeId: string) => api.delete(`/users/me/watchlist/${animeId}`),
};

export const animeApi = {
  getAll: () => api.get<any[]>('/characters/animes'),
};

export const activityApi = {
  getFeed: () => api.get<any[]>('/notifications?limit=50'),
};

export const pushApi = {
  saveToken: (token: string) => api.post('/users/me/push-token', { token }),
};

export const guildWarsApi = {
  getActive: () => api.get<any[]>('/guild-wars'),
  getMy: () => api.get<any[]>('/guild-wars/my'),
  challenge: (defenderGuildId: string) => api.post<any>('/guild-wars/challenge', { defenderGuildId }),
  accept: (warId: string) => api.post<any>(`/guild-wars/${warId}/accept`),
};
