import { create } from 'zustand';
// import { playSFX } from '@core/services/audioService';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  appId: string;
}

export type NewNotification = Omit<AppNotification, 'id'> & { id?: string };

interface NotificationState {
  notifications: AppNotification[];
  addNotification: (input: NewNotification) => string;
  removeNotification: (id: string) => void;
}

let counter = 0;

function makeId(): string {
  counter += 1;
  return `notif_${Date.now()}_${counter}`;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (input) => {
    const id = input.id ?? makeId();
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id, title: input.title, message: input.message, appId: input.appId },
      ],
    }));
    // playSFX('notification');
    return id;
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));