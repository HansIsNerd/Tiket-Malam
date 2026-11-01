import { useEffect } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import { playAmbient, stopAmbient } from '@core/services/audioService';

const BLACKOUT_MS = 4000;
const AMBIENT_RESUME_MS = 2000;

export function BlackoutOverlay() {
  const started = useGameStore((s) => s.flags.act2.e19BlackoutStarted);
  const done = useGameStore((s) => s.flags.act2.e19Blackout);
  const active = started && !done;

  useEffect(() => {
    if (!active) return;
    stopAmbient(0);
    const timer = window.setTimeout(() => {
      const { setFlag } = useGameStore.getState();
      setFlag('ui.desktopTheme', 'dark');
      setFlag('act2.e19Blackout', true);
      playAmbient(AMBIENT_RESUME_MS);
    }, BLACKOUT_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      tabIndex={-1}
      onPointerDown={(e) => e.preventDefault()}
      onClick={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => e.preventDefault()}
      className="fixed inset-0 z-[10100] cursor-none select-none bg-black"
    />
  );
}