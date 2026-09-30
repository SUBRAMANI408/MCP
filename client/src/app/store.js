import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('sap_token', token);
        set({ user, token, isAuthenticated: true });
      },
      updateUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('sap_token');
        localStorage.removeItem('sap_user');
        localStorage.removeItem('sap_auth');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: 'sap_auth', partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }) }
  )
);

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications, unreadCount) => set({ notifications, unreadCount }),
  addNotification: (notification) => set((state) => ({
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1,
  })),
  markRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n._id === id ? { ...n, isRead: true } : n),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, isRead: true })),
    unreadCount: 0,
  })),
}));

export const useChatStore = create((set, get) => ({
  activeGroup: null,
  messages: {},
  typingUsers: {},
  setActiveGroup: (group) => set({ activeGroup: group }),
  setMessages: (groupId, messages) => set((state) => ({
    messages: { ...state.messages, [groupId]: messages },
  })),
  addMessage: (groupId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [groupId]: [...(state.messages[groupId] || []), message],
    },
  })),
  setTyping: (groupId, user, isTyping) => set((state) => ({
    typingUsers: {
      ...state.typingUsers,
      [groupId]: isTyping
        ? [...(state.typingUsers[groupId] || []).filter(u => u.userId !== user.userId), user]
        : (state.typingUsers[groupId] || []).filter(u => u.userId !== user.userId),
    },
  })),
}));

export const useMatchStore = create((set) => ({
  liveMatches: [],
  activeMatch: null,
  setLiveMatches: (matches) => set({ liveMatches: matches }),
  setActiveMatch: (match) => set({ activeMatch: match }),
  updateMatchScore: (matchId, scoreSummary, event) => set((state) => ({
    liveMatches: state.liveMatches.map(m =>
      m._id === matchId ? { ...m, scoreSummary } : m
    ),
    activeMatch: state.activeMatch?._id === matchId
      ? { ...state.activeMatch, scoreSummary, events: [...(state.activeMatch.events || []), event] }
      : state.activeMatch,
  })),
}));
