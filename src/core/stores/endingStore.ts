import { create } from 'zustand';

export type EndingId = 'keluar';

interface EndingState {
  ending: EndingId | null;
}

export const useEndingStore = create<EndingState>(() => ({
  ending: null,
}));