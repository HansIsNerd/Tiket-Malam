import { create } from 'zustand';
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

export const useGameStore = create<GameState>((set) => ({
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
}));