import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;

  connect(): Socket {
    if (this.socket?.connected) return this.socket;

    const token = Cookies.get('access_token');

    this.socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket!.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('auth_error', (data) => {
      console.error('[Socket] Auth error:', data);
      this.disconnect();
    });

    this.socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      this.reconnectAttempts++;
    });

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ─── Chat ─────────────────────────────────────────────────────────

  joinRoom(roomId: string) {
    this.socket?.emit('chat:join_room', { roomId });
  }

  leaveRoom(roomId: string) {
    this.socket?.emit('chat:leave_room', { roomId });
  }

  sendMessage(roomId: string, content: string, characterId?: string, extraMeta?: object) {
    this.socket?.emit('chat:send_message', { roomId, content, characterId, extraMeta });
  }

  sendTyping(roomId: string, isTyping: boolean) {
    this.socket?.emit('chat:typing', { roomId, isTyping });
  }

  reactToMessage(roomId: string, messageId: string, emoji: string) {
    this.socket?.emit('chat:react', { roomId, messageId, emoji });
  }

  getReactions(messageIds: string[]) {
    this.socket?.emit('chat:get_reactions', { messageIds });
  }

  setBackground(roomId: string, backgroundUrl: string) {
    this.socket?.emit('chat:set_background', { roomId, backgroundUrl });
  }

  // ─── Event listeners ──────────────────────────────────────────────

  onMessage(callback: (data: any) => void) {
    this.socket?.on('chat:message', callback);
    return () => this.socket?.off('chat:message', callback);
  }

  onHistory(callback: (data: any) => void) {
    this.socket?.on('chat:history', callback);
    return () => this.socket?.off('chat:history', callback);
  }

  onTyping(callback: (data: any) => void) {
    this.socket?.on('chat:typing', callback);
    return () => this.socket?.off('chat:typing', callback);
  }

  onAttackReceived(callback: (data: any) => void) {
    this.socket?.on('attack:received', callback);
    return () => this.socket?.off('attack:received', callback);
  }

  onNotification(callback: (data: any) => void) {
    this.socket?.on('notification', callback);
    return () => this.socket?.off('notification', callback);
  }

  onOnlineCount(callback: (data: { count: number }) => void) {
    this.socket?.on('online:count', callback);
    return () => this.socket?.off('online:count', callback);
  }

  onModerationWarning(callback: (data: any) => void) {
    this.socket?.on('moderation:warning', callback);
    return () => this.socket?.off('moderation:warning', callback);
  }

  onModerationMuted(callback: (data: any) => void) {
    this.socket?.on('moderation:muted', callback);
    return () => this.socket?.off('moderation:muted', callback);
  }

  onUserJoined(callback: (data: any) => void) {
    this.socket?.on('chat:user_joined', callback);
    return () => this.socket?.off('chat:user_joined', callback);
  }

  onError(callback: (data: any) => void) {
    this.socket?.on('error', callback);
    return () => this.socket?.off('error', callback);
  }

  onReactionUpdate(callback: (data: { messageId: string; reactions: Record<string, string[]> }) => void) {
    this.socket?.on('chat:reaction_update', callback);
    return () => this.socket?.off('chat:reaction_update', callback);
  }

  onReactionsBulk(callback: (data: Record<string, Record<string, string[]>>) => void) {
    this.socket?.on('chat:reactions_bulk', callback);
    return () => this.socket?.off('chat:reactions_bulk', callback);
  }

  onBackgroundChanged(callback: (data: { roomId: string; backgroundUrl: string | null }) => void) {
    this.socket?.on('chat:background_changed', callback);
    return () => this.socket?.off('chat:background_changed', callback);
  }
}

export const socketManager = new SocketManager();
