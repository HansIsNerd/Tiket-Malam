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

export type TrayMenu = 'quick_settings' | 'calendar' | null;

interface UiState {
  scene: Scene;
  windows: WindowInstance[];
  focusedWindowId: string | null;
  nextZIndex: number;
  activeTrayMenu: TrayMenu;
  isStartMenuOpen: boolean;
  setScene: (scene: Scene) => void;
  openWindow: (input: OpenWindowInput) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, position: Position) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMaximizeWindow: (id: string) => void;
  hideWindow: (id: string) => void;
  setTrayMenu: (menu: TrayMenu) => void;
  toggleStartMenu: () => void;
}

function pickTopId(windows: WindowInstance[], excludeId: string): string | null {
  const top = windows
    .filter((w) => w.id !== excludeId && !w.isMinimized && !w.isHidden)
    .sort((a, b) => b.zIndex - a.zIndex)[0];
  return top ? top.id : null;
}

function withFocus(windows: WindowInstance[], focusId: string | null): WindowInstance[] {
  return windows.map((w) => ({ ...w, isFocused: w.id === focusId }));
}

export const useUiStore = create<UiState>((set, get) => ({
  scene: 'boot',
  windows: [],
  focusedWindowId: null,
  nextZIndex: 1,
  activeTrayMenu: null,
  isStartMenuOpen: false,

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
        isMaximized: false,
        isHidden: false,
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
        isStartMenuOpen: false,
        activeTrayMenu: null,
      };
    });
  },

  closeWindow: (id) =>
    set((state) => {
      const remaining = state.windows.filter((w) => w.id !== id);
      if (state.focusedWindowId !== id) return { windows: remaining };
      const topId = pickTopId(remaining, id);
      return {
        windows: withFocus(remaining, topId),
        focusedWindowId: topId,
      };
    }),

  focusWindow: (id) =>
    set((state) => {
      if (!state.windows.some((w) => w.id === id)) return state;
      return {
        windows: state.windows.map((w) =>
          w.id === id
            ? {
                ...w,
                isFocused: true,
                isMinimized: false,
                isHidden: false,
                zIndex: state.nextZIndex,
              }
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

  minimizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: true, isFocused: false } : w,
      ),
      focusedWindowId: null,
    })),

  restoreWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: false } : w,
      ),
    }));
    get().focusWindow(id);
  },

  toggleMaximizeWindow: (id) =>
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMaximized: !w.isMaximized } : w,
      ),
    })),

  hideWindow: (id) =>
    set((state) => {
      const next = state.windows.map((w) =>
        w.id === id ? { ...w, isHidden: true, isFocused: false } : w,
      );
      if (state.focusedWindowId !== id) return { windows: next };
      const topId = pickTopId(next, id);
      return { windows: withFocus(next, topId), focusedWindowId: topId };
    }),

  setTrayMenu: (menu) =>
    set((state) => ({
      activeTrayMenu: state.activeTrayMenu === menu ? null : menu,
      isStartMenuOpen: false,
    })),

  toggleStartMenu: () =>
    set((state) => ({
      isStartMenuOpen: !state.isStartMenuOpen,
      activeTrayMenu: null,
    })),
}));