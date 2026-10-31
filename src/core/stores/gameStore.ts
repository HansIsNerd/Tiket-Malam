import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useUiStore } from '@core/stores/uiStore';
import type { ChatData } from '@core/types/chat';
import type { MailData } from '@core/types/mail';
import type { FileData } from '@core/types/files';
import type { TicketData } from '@core/types/tickets';
import type { DirectoryData } from '@core/types/directory';

export interface Act1Flags {
  ticket4471CloseClicked: boolean;
  ticket4471ReplyAttempted: boolean;
  directoryBagasSeen: boolean;
  signedOffboarding: boolean;
  janganBukaRead: boolean;
  janganBukaReadEnough: boolean;
  playerTriedToQuit: boolean;
  act2Gate: boolean;
}

export interface Act2Flags {
  e02LogOpened: boolean;
  e02LogRead: boolean;
  e02ScrollCount: number;
  e04RaniAuthority: boolean;
  e09BagasContact: boolean;
  e10Instruction: boolean;
}

export interface UiFlags {
  desktopTheme: 'light' | 'dark';
}

export interface Flags {
  act1: Act1Flags;
  act2: Act2Flags;
  ui: UiFlags;
}

export type FlagPath = {
  [S in keyof Flags]: `${S}.${Extract<keyof Flags[S], string>}`;
}[keyof Flags];

export type FlagValue<P extends FlagPath> = P extends `${infer S}.${infer K}`
  ? S extends keyof Flags
    ? K extends keyof Flags[S]
      ? Flags[S][K]
      : never
    : never
  : never;

interface GameState {
  playerName: string;
  act: number;
  timeCurrent: string;
  chatData: ChatData | null;
  ticketData: TicketData | null;
  mailData: MailData | null;
  fileData: FileData | null;
  directoryData: DirectoryData | null;
  flags: Flags;
  setPlayerName: (name: string) => void;
  setAct: (act: number) => void;
  setTime: (time: string) => void;
  setChatData: (data: ChatData) => void;
  setTicketData: (data: TicketData) => void;
  setMailData: (data: MailData) => void;
  setFileData: (data: FileData) => void;
  setDirectoryData: (data: DirectoryData) => void;
  setFlag: <P extends FlagPath>(path: P, value: FlagValue<P>) => void;
  completeBoot: (name?: string) => void;
}

interface PersistedGameState {
  playerName: string;
  act: number;
  timeCurrent: string;
  flags: Flags;
}

const SAVE_KEY = 'tiket-malam-save';
const SAVE_VERSION = 2;

let persistenceLocked = false;

export function resetSavedGame(): void {
  persistenceLocked = true;
  try {
    window.localStorage.removeItem(SAVE_KEY);
  } catch {
    // penyimpanan tidak tersedia
  }
}

const saveStorage = createJSONStorage<PersistedGameState>(() => ({
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (persistenceLocked) return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // penyimpanan penuh atau tidak tersedia
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // penyimpanan tidak tersedia
    }
  },
}));

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      playerName: 'Dimas',
      act: 1,
      timeCurrent: '22:47',
      chatData: null,
      ticketData: null,
      mailData: null,
      fileData: null,
      directoryData: null,
      flags: {
        act1: {
          ticket4471CloseClicked: false,
          ticket4471ReplyAttempted: false,
          directoryBagasSeen: false,
          signedOffboarding: false,
          janganBukaRead: false,
          janganBukaReadEnough: false,
          playerTriedToQuit: false,
          act2Gate: false,
        },
        act2: {
          e02LogOpened: false,
          e02LogRead: false,
          e02ScrollCount: 0,
          e04RaniAuthority: false,
          e09BagasContact: false,
          e10Instruction: false,
        },
        ui: {
          desktopTheme: 'light',
        },
      },

      setPlayerName: (name) => set({ playerName: name }),
      setAct: (act) => set({ act }),
      setTime: (time) => set({ timeCurrent: time }),
      setChatData: (data) => set({ chatData: data }),
      setTicketData: (data) => set({ ticketData: data }),
      setMailData: (data) => set({ mailData: data }),
      setFileData: (data) => set({ fileData: data }),
      setDirectoryData: (data) => set({ directoryData: data }),
      setFlag: (path, value) =>
        set((state) => {
          const [section, key] = path.split('.') as [keyof Flags, string];
          return {
            flags: {
              ...state.flags,
              [section]: { ...state.flags[section], [key]: value },
            } as Flags,
          };
        }),

      completeBoot: (name) => {
        const trimmed = name?.trim();
        if (trimmed) set({ playerName: trimmed });
        useUiStore.getState().setScene('windows');
      },
    }),
    {
      name: SAVE_KEY,
      version: SAVE_VERSION,
      storage: saveStorage,
      migrate: () => undefined as unknown as PersistedGameState,
      partialize: (state): PersistedGameState => ({
        playerName: state.playerName,
        act: state.act,
        timeCurrent: state.timeCurrent,
        flags: state.flags,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<PersistedGameState> | undefined;
        if (!saved) return current;
        if (saved.flags?.act2?.e10Instruction) return current;
        return {
          ...current,
          playerName: saved.playerName ?? current.playerName,
          act: saved.act ?? current.act,
          timeCurrent: saved.timeCurrent ?? current.timeCurrent,
          flags: {
            act1: { ...current.flags.act1, ...saved.flags?.act1 },
            act2: { ...current.flags.act2, ...saved.flags?.act2 },
            ui: { ...current.flags.ui, ...saved.flags?.ui },
          },
        };
      },
    },
  ),
);