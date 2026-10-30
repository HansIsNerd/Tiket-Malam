import { create } from 'zustand';
import { useUiStore } from '@core/stores/uiStore';
import type { ChatData } from '@core/types/chat';
import type { MailData } from '@core/types/mail';
import type { FileData } from '@core/types/files';
import type { TicketData } from '@core/types/tickets';

export interface Act1Flags {
  ticket4471CloseClicked: boolean;
  ticket4471ReplyAttempted: boolean;
}

export interface Flags {
  act1: Act1Flags;
}

interface GameState {
  playerName: string;
  act: number;
  timeCurrent: string;
  chatData: ChatData | null;
  ticketData: TicketData | null;
  mailData: MailData | null;
  fileData: FileData | null;
  flags: Flags;
  setPlayerName: (name: string) => void;
  setAct: (act: number) => void;
  setTime: (time: string) => void;
  setChatData: (data: ChatData) => void;
  setTicketData: (data: TicketData) => void;
  setMailData: (data: MailData) => void;
  setFileData: (data: FileData) => void;
  setFlag: <K extends keyof Act1Flags>(
    path: `act1.${K}`,
    value: Act1Flags[K],
  ) => void;
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
  flags: {
    act1: {
      ticket4471CloseClicked: false,
      ticket4471ReplyAttempted: false,
    },
  },

  setPlayerName: (name) => set({ playerName: name }),

  setAct: (act) => set({ act }),

  setTime: (time) => set({ timeCurrent: time }),

  setChatData: (data) => set({ chatData: data }),

  setTicketData: (data) => set({ ticketData: data }),

  setMailData: (data) => set({ mailData: data }),

  setFileData: (data) => set({ fileData: data }),

  setFlag: (path, value) =>
    set((state) => {
      const key = path.slice('act1.'.length) as keyof Act1Flags;
      return {
        flags: {
          ...state.flags,
          act1: { ...state.flags.act1, [key]: value },
        },
      };
    }),

  completeBoot: (name) => {
    const trimmed = name?.trim();
    if (trimmed) set({ playerName: trimmed });
    useUiStore.getState().setScene('windows');
  },
}));