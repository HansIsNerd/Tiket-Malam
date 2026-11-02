import { create } from 'zustand';

interface MinigameState {
  remotePatchRequested: boolean;
  requestRemotePatch: () => void;
  clearRemotePatch: () => void;
}

export const useMinigameStore = create<MinigameState>((set) => ({
  remotePatchRequested: false,
  requestRemotePatch: () => set({ remotePatchRequested: true }),
  clearRemotePatch: () => set({ remotePatchRequested: false }),
}));