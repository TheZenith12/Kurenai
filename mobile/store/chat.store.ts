import { create } from 'zustand';

interface Message {
  id: string;
  roomId: string;
  senderId: string;
  username: string;
  content: string;
  isFiltered: boolean;
  metadata?: any;
  createdAt: string;
}

interface TypingUser { userId: string; username: string; }

interface ChatState {
  messages: Record<string, Message[]>;
  typingUsers: Record<string, TypingUser[]>;
  activeRoom: string;
  onlineCount: number;
  setActiveRoom: (roomId: string) => void;
  addMessage: (roomId: string, msg: Message) => void;
  setHistory: (roomId: string, msgs: Message[]) => void;
  setTyping: (roomId: string, user: TypingUser, isTyping: boolean) => void;
  setOnlineCount: (count: number) => void;
  deleteMessage: (roomId: string, messageId: string) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: {},
  typingUsers: {},
  activeRoom: 'all',
  onlineCount: 0,

  setActiveRoom: (roomId) => set({ activeRoom: roomId }),

  addMessage: (roomId, msg) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: [...(state.messages[roomId] ?? []).slice(-199), msg],
      },
    })),

  setHistory: (roomId, msgs) =>
    set((state) => ({ messages: { ...state.messages, [roomId]: msgs } })),

  setTyping: (roomId, user, isTyping) =>
    set((state) => {
      const current = state.typingUsers[roomId] ?? [];
      const filtered = current.filter((u) => u.userId !== user.userId);
      return {
        typingUsers: {
          ...state.typingUsers,
          [roomId]: isTyping ? [...filtered, user] : filtered,
        },
      };
    }),

  setOnlineCount: (count) => set({ onlineCount: count }),

  deleteMessage: (roomId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [roomId]: (state.messages[roomId] ?? []).filter((m) => m.id !== messageId),
      },
    })),
}));
