import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
    // Request: access token нэмэх
    this.client.interceptors.request.use((config) => {
      const token = Cookies.get('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response: 401 бол refresh хийх
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
            const refreshToken = Cookies.get('refresh_token');
            if (!refreshToken) throw new Error('No refresh token');

            const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

            Cookies.set('access_token', data.accessToken, { expires: 1/96 }); // 15 min
            Cookies.set('refresh_token', data.refreshToken, { expires: 7 });

            this.refreshSubscribers.forEach((cb) => cb(data.accessToken));
            this.refreshSubscribers = [];

            original.headers.Authorization = `Bearer ${data.accessToken}`;
            return this.client(original);
          } catch {
            Cookies.remove('access_token');
            Cookies.remove('refresh_token');
            if (typeof window !== 'undefined') {
              // Zustand persist store цэвэрлэнэ — isAuthenticated: true хэвээр үлдэхгүй
              localStorage.removeItem('anime-auth');
              window.location.href = '/login';
            }
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

// ─── API endpoints ─────────────────────────────────────────────────

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
  sendVerification: () => api.post<any>('/auth/send-verification'),
  verifyEmail: (code: string) => api.post<any>('/auth/verify-email', { code }),
};

export const characterApi = {
  getAnimes: () => api.get<any[]>('/characters/animes'),
  getAnime: (id: string) => api.get<any>(`/characters/animes/${id}`),
  getMyCharacters: () => api.get<any[]>('/characters/my'),
  selectFree: (characterId: string) => api.post('/characters/select-free', { characterId }),
  setActive: (userCharacterId: string) => api.post('/characters/set-active', { userCharacterId }),
  buyWithPoints: (characterId: string) => api.post('/characters/buy-with-points', { characterId }),
};

export const chatApi = {
  getRoomMessages: (roomId: string, limit = 50) =>
    api.get<any[]>(`/chat/rooms/${roomId}/messages?limit=${limit}`),
  getMyAnimeRooms: () => api.get<any[]>('/chat/my-anime-rooms'),
  getMyPrivateRooms: () => api.get<any[]>('/chat/my-private-rooms'),
  createPrivateRoom: (userId: string) => api.post<any>('/chat/private', { userId }),
  deleteMessage: (messageId: string) => api.delete(`/chat/messages/${messageId}`),
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const Cookies = (await import('js-cookie')).default;
    const token = Cookies.get('access_token');
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const res = await fetch(`${base}/chat/upload/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Upload амжилтгүй');
    return res.json();
  },
  getRoomBackground: (roomId: string) =>
    api.get<{ backgroundUrl: string | null }>(`/chat/rooms/${roomId}/background`),
  setRoomBackground: (roomId: string, backgroundUrl: string | null) =>
    api.patch<any>(`/chat/rooms/${roomId}/background`, { backgroundUrl }),
  uploadRoomBackground: async (roomId: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const Cookies = (await import('js-cookie')).default;
    const token = Cookies.get('access_token');
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const res = await fetch(`${base}/chat/rooms/${roomId}/upload-background`, {
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
  getReplay: (logId: string) => api.get<any>(`/attack/replay/${logId}`),
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

export const paymentApi = {
  createQpay: (characterId: string) =>
    api.post<any>('/payment/qpay/create', { characterId }),
  checkQpay: (paymentId: string) => api.get<any>(`/payment/qpay/status/${paymentId}`),
  submitBankTransfer: (characterId: string, transferRef?: string) =>
    api.post<any>('/payment/bank-transfer', { characterId, transferRef }),
  getMyPayments: () => api.get<any[]>('/payment/my'),
};

export const usersApi = {
  getMe: () => api.get<any>('/users/me'),
  getProfile: (userId: string) => api.get<any>(`/users/${userId}`),
  search: (q: string) => api.get<any[]>(`/users/search?q=${encodeURIComponent(q)}`),
};

export const leaderboardApi = {
  getAttack: (limit?: number) => api.get<any[]>(`/leaderboard/attack?limit=${limit ?? 50}`),
  getMiniGame: (period?: string) =>
    api.get<any[]>(`/leaderboard/mini-game?period=${period ?? 'daily'}`),
  getMastery: () => api.get<any[]>('/leaderboard/mastery'),
  getAnime: (animeId: string) => api.get<any[]>(`/leaderboard/anime/${animeId}`),
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
  getMyRolls: () => api.get<any[]>('/gacha/my-rolls'),
  getPity: (poolId: string) => api.get<{ pity: number }>(`/gacha/pity/${poolId}`),
  roll: (poolId: string, count: 1 | 10) => api.post<any[]>(`/gacha/roll/${poolId}`, { count }),
};

export const guildWarsApi = {
  getActive: () => api.get<any[]>('/guild-wars'),
  getMy: () => api.get<any[]>('/guild-wars/my'),
  challenge: (defenderGuildId: string) => api.post<any>('/guild-wars/challenge', { defenderGuildId }),
  accept: (warId: string) => api.post<any>(`/guild-wars/${warId}/accept`),
};

export const loginStreakApi = {
  getStreak: () => api.get<any>('/auth/streak'),
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

export const guildApi = {
  getMyGuild: () => api.get<any>('/guilds/my'),
  joinGuild: (guildId: string) => api.post('/guilds/join', { guildId }),
  leaveGuild: () => api.post('/guilds/leave'),
  getLeaderboard: () => api.get<any[]>('/leaderboard/guild'),
  createGuild: (data: { name: string; description?: string; animeId: string }) => api.post<any>('/guilds', data),
  updateGuild: (data: { name?: string; description?: string }) => api.patch<any>('/guilds', data),
  promoteMember: (targetUserId: string, role: string) => api.post<any>('/guilds/promote', { targetUserId, role }),
};

export const watchlistApi = {
  getAll: () => api.get<any[]>('/users/me/watchlist'),
  add: (animeId: string, status?: string) => api.post<any>('/users/me/watchlist', { animeId, status }),
  remove: (animeId: string) => api.delete(`/users/me/watchlist/${animeId}`),
};

export const animeApi = {
  getAll: () => api.get<any[]>('/admin/anime'),
};

export const pushApi = {
  saveToken: (token: string) => api.post('/users/me/push-token', { token }),
};

export const activityApi = {
  getFeed: () => api.get<any[]>('/notifications?limit=50'),
};

export const seasonAdminApi = {
  startSeason: () => api.post<any>('/admin/season/start'),
  endSeason: () => api.post<any>('/admin/season/end'),
};

export const adminApi = {
  getDashboard: () => api.get<any>('/admin/dashboard'),
  getUsers: (params?: string) => api.get<any>(`/admin/users?${params ?? ''}`),
  banUser: (userId: string, reason: string, durationHours?: number) =>
    api.post('/admin/ban', { userId, reason, durationHours }),
  unbanUser: (userId: string) => api.post('/admin/unban', { userId }),
  getPendingPayments: () => api.get<any[]>('/admin/payments/pending'),
  verifyPayment: (paymentId: string) => api.post(`/admin/payments/${paymentId}/verify`),
  rejectPayment: (paymentId: string, reason: string) =>
    api.post(`/admin/payments/${paymentId}/reject`, { reason }),
  unlockCharacter: (userId: string, characterId: string) =>
    api.post('/admin/characters/unlock', { userId, characterId }),
  updateCharacterPrice: (characterId: string, price: number) =>
    api.patch(`/admin/characters/${characterId}/price`, { price }),
  getReports: () => api.get<any[]>('/admin/reports'),
  resolveReport: (reportId: string, action: string, notes?: string) =>
    api.post(`/admin/reports/${reportId}/resolve`, { action, notes }),
  getMetrics: () => api.get<any>('/admin/metrics'),

  // ─── Anime CRUD ────────────────────────────────────────
  getAllAnimes: () => api.get<any[]>('/admin/anime'),
  createAnime: (data: { name: string; description: string; imageUrl: string; bannerUrl?: string; sortOrder?: number }) =>
    api.post<any>('/admin/anime', data),
  updateAnime: (id: string, data: any) => api.patch<any>(`/admin/anime/${id}`, data),
  deleteAnime: (id: string) => api.delete(`/admin/anime/${id}`),

  // ─── Character CRUD ────────────────────────────────────
  createCharacter: (animeId: string, data: any) =>
    api.post<any>(`/admin/anime/${animeId}/characters`, data),
  updateCharacter: (id: string, data: any) => api.patch<any>(`/admin/characters/${id}`, data),
  deleteCharacter: (id: string) => api.delete(`/admin/characters/${id}`),

  // ─── Skill CRUD ────────────────────────────────────────
  createSkill: (characterId: string, data: any) =>
    api.post<any>(`/admin/characters/${characterId}/skills`, data),
  deleteSkill: (id: string) => api.delete(`/admin/skills/${id}`),

  // ─── Image Upload ───────────────────────────────────────
  uploadImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const Cookies = (await import('js-cookie')).default;
    const token = Cookies.get('access_token');
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/admin/upload/image`,
      { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: formData },
    );
    if (!res.ok) throw new Error('Upload амжилтгүй боллоо');
    return res.json();
  },
};
