import { create } from 'zustand';
import type {
  OpenWindowInput,
  Position,
  Scene,
  WindowInstance,
} from '@core/types';

const DEFAULT_SIZE = { width: 480, height: 320 };
const CASCADE_BASE = 80;
const CASCADE_STEP = 30;

interface UiState {
  scene: Scene;
  windows: WindowInstance[];
  focusedWindowId: string | null;
  nextZIndex: number;
  setScene: (scene: Scene) => void;
  openWindow: (input: OpenWindowInput) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, position: Position) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  scene: 'boot',
  windows: [],
  focusedWindowId: null,
  nextZIndex: 1,

  setScene: (scene) => set({ scene }),

  openWindow: (input) => {
    const existing = get().windows.find((w) => w.appId === input.appId);
    if (existing) {
      get().focusWindow(existing.id);
      return;
    }

    set((state) => {
      const offset = CASCADE_BASE + (state.windows.length % 8) * CASCADE_STEP;
      const created: WindowInstance = {
        id: input.appId,
        appId: input.appId,
        title: input.title,
        position: input.position ?? { x: offset, y: offset },
        size: input.size ?? DEFAULT_SIZE,
        isMinimized: false,
        isFocused: true,
        zIndex: state.nextZIndex,
      };
      return {
        windows: [
          ...state.windows.map((w) => ({ ...w, isFocused: false })),
          created,
        ],
        focusedWindowId: created.id,
        nextZIndex: state.nextZIndex + 1,
      };
    });
  },

  closeWindow: (id) =>
    set((state) => {
      const remaining = state.windows.filter((w) => w.id !== id);
      if (state.focusedWindowId !== id) return { windows: remaining };

      const top = remaining
        .filter((w) => !w.isMinimized)
        .sort((a, b) => b.zIndex - a.zIndex)[0];

      return {
        windows: remaining.map((w) => ({
          ...w,
          isFocused: top !== undefined && w.id === top.id,
        })),
        focusedWindowId: top ? top.id : null,
      };
    }),

  focusWindow: (id) =>
    set((state) => {
      if (!state.windows.some((w) => w.id === id)) return state;
      return {
        windows: state.windows.map((w) =>
          w.id === id
            ? { ...w, isFocused: true, isMinimized: false, zIndex: state.nextZIndex }
            : { ...w, isFocused: false },
        ),
        focusedWindowId: id,
        nextZIndex: state.nextZIndex + 1,
      };
    }),

  moveWindow: (id, position) =>
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, position } : w)),
    })),
}));