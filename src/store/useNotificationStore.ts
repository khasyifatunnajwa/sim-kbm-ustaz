import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NotificationType = 'jadwal' | 'pengumuman' | 'agenda' | 'reminder' | 'info' | 'warning' | 'success' | 'error';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionLabel?: string;
  actionTab?: string;
  dismissed?: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (n: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  dismissNotification: (id: string) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearAll: () => void;
  removeOldNotifications: () => void;
}

const MAX_NOTIFICATIONS = 50;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (n) => {
        const notif: AppNotification = {
          ...n,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: Date.now(),
          read: false,
        };
        set((state) => {
          const notifications = [notif, ...state.notifications].slice(0, MAX_NOTIFICATIONS);
          return {
            notifications,
            unreadCount: notifications.filter(x => !x.read).length,
          };
        });
      },

      dismissNotification: (id) => {
        set((state) => {
          const notifications = state.notifications.map(n =>
            n.id === id ? { ...n, dismissed: true, read: true } : n
          );
          return {
            notifications,
            unreadCount: notifications.filter(x => !x.read).length,
          };
        });
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map(n => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      markRead: (id) => {
        set((state) => {
          const notifications = state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications,
            unreadCount: notifications.filter(x => !x.read).length,
          };
        });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      removeOldNotifications: () => {
        const cutoff = Date.now() - MAX_AGE_MS;
        set((state) => {
          const notifications = state.notifications.filter(n => n.timestamp > cutoff);
          return {
            notifications,
            unreadCount: notifications.filter(x => !x.read).length,
          };
        });
      },
    }),
    { name: 'simkbm-notifications' },
  ),
);
