import { create } from 'zustand';

export type EndingId = 'lapor' | 'hapus' | 'keluar' | 'lanjut';

interface EndingState {
  ending: EndingId | null;
}

export const useEndingStore = create<EndingState>(() => ({
  ending: null,
}));