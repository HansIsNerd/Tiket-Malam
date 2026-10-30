import { create } from 'zustand';
import { useUiStore } from '@core/stores/uiStore';

interface GameState {
  playerName: string;
  act: number;
  timeCurrent: string;
  setPlayerName: (name: string) => void;
  setAct: (act: number) => void;
  setTime: (time: string) => void;
  completeBoot: (name?: string) => void;
}

export const useGameStore = create<GameState>((set) => ({
  playerName: 'Dimas',
  act: 1,
  timeCurrent: '22:47',

  setPlayerName: (name) => set({ playerName: name }),

  setAct: (act) => set({ act }),

  setTime: (time) => set({ timeCurrent: time }),

  completeBoot: (name) => {
    const trimmed = name?.trim();
    if (trimmed) set({ playerName: trimmed });
    useUiStore.getState().setScene('windows');
  },
}));