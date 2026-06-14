import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

export const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'http://10.0.2.2:3001';

class SocketManager {
  private socket: Socket | null = null;

  async connect(): Promise<Socket> {
    if (this.socket?.connected) return this.socket;

    let token: string | null = null;
    try { token = await SecureStore.getItemAsync('access_token'); } catch {}

    this.socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => console.log('[Socket] Connected:', this.socket!.id));
    this.socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
    this.socket.on('auth_error', () => this.disconnect());
    this.socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));

    return this.socket;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  getSocket(): Socket | null { return this.socket; }
  isConnected(): boolean { return this.socket?.connected ?? false; }

  joinRoom(roomId: string) { this.socket?.emit('chat:join_room', { roomId }); }
  leaveRoom(roomId: string) { this.socket?.emit('chat:leave_room', { roomId }); }
  sendMessage(roomId: string, content: string, characterId?: string, extraMeta?: object) {
    this.socket?.emit('chat:send_message', { roomId, content, characterId, extraMeta });
  }
  sendTyping(roomId: string, isTyping: boolean) {
    this.socket?.emit('chat:typing', { roomId, isTyping });
  }
  reactToMessage(roomId: string, messageId: string, emoji: string) {
    this.socket?.emit('chat:react', { roomId, messageId, emoji });
  }

  onMessage(cb: (data: any) => void) {
    this.socket?.on('chat:message', cb);
    return () => this.socket?.off('chat:message', cb);
  }
  onHistory(cb: (data: any) => void) {
    this.socket?.on('chat:history', cb);
    return () => this.socket?.off('chat:history', cb);
  }
  onTyping(cb: (data: any) => void) {
    this.socket?.on('chat:typing', cb);
    return () => this.socket?.off('chat:typing', cb);
  }
  onAttackReceived(cb: (data: any) => void) {
    this.socket?.on('attack:received', cb);
    return () => this.socket?.off('attack:received', cb);
  }
  onNotification(cb: (data: any) => void) {
    this.socket?.on('notification', cb);
    return () => this.socket?.off('notification', cb);
  }
  onOnlineCount(cb: (data: { count: number }) => void) {
    this.socket?.on('online:count', cb);
    return () => this.socket?.off('online:count', cb);
  }
  onModerationWarning(cb: (data: any) => void) {
    this.socket?.on('moderation:warning', cb);
    return () => this.socket?.off('moderation:warning', cb);
  }
  onReactionUpdate(cb: (data: { messageId: string; reactions: Record<string, string[]> }) => void) {
    this.socket?.on('chat:reaction_update', cb);
    return () => this.socket?.off('chat:reaction_update', cb);
  }
}

export const socketManager = new SocketManager();
