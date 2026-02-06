import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;

  addMessage: (role: ChatMessage['role'], content: string) => string;
  updateMessage: (id: string, content: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,

  addMessage: (role, content) => {
    const id = generateId();
    set((state) => ({
      messages: [
        ...state.messages,
        { id, role, content, timestamp: Date.now() },
      ],
    }));
    return id;
  },

  updateMessage: (id, content) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content } : msg
      ),
    }));
  },

  setLoading: (loading) => set({ isLoading: loading }),

  clearMessages: () => set({ messages: [] }),
}));
