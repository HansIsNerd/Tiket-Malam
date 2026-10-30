import { useGameStore } from '@core/stores/gameStore';

export function Taskbar() {
  const timeCurrent = useGameStore((s) => s.timeCurrent);

  return (
    <footer className="absolute inset-x-0 bottom-0 z-[9999] flex h-12 items-center justify-between border-t border-neutral-700 bg-neutral-900 px-3">
      <button
        type="button"
        className="px-3 py-1 text-sm font-semibold hover:bg-white/10"
      >
        Start
      </button>
      <span className="text-sm tabular-nums text-neutral-300">{timeCurrent}</span>
    </footer>
  );
}