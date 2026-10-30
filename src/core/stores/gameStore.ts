import { create } from 'zustand';
import { useUiStore } from '@core/stores/uiStore';
import type { ChatData } from '@core/types/chat';

interface GameState {
  playerName: string;
  act: number;
  timeCurrent: string;
  chatData: ChatData | null;
  setPlayerName: (name: string) => void;
  setAct: (act: number) => void;
  setTime: (time: string) => void;
  setChatData: (data: ChatData) => void;
  completeBoot: (name?: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
  playerName: 'Dimas',
  act: 1,
  timeCurrent: '22:47',
  chatData: null,

  setPlayerName: (name) => set({ playerName: name }),

  setAct: (act) => set({ act }),

  setTime: (time) => set({ timeCurrent: time }),

  setChatData: (data) => set({ chatData: data }),

  completeBoot: (name) => {
    const trimmed = name?.trim();
    if (trimmed) set({ playerName: trimmed });
    useUiStore.getState().setScene('windows');
  },
}));