import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { MacDesktop } from '@macos/MacDesktop';
import { MacWindowFrame } from '@macos/MacWindowFrame';

const FADE_TO_BLACK_MS = 1500;
const BLACK_HOLD_MS = 800;

export function MacOSScene() {
  const macWindows = useUiStore((s) => s.macWindows);
  const setScene = useUiStore((s) => s.setScene);
  const triedForceQuit03 = useGameStore((s) => s.flags.mac.triedForceQuit03);
  const notesRead = useGameStore((s) => s.flags.mac.notesRead);
  const [fading, setFading] = useState<boolean>(false);

  const allClosed = macWindows.length === 0;

  useEffect(() => {
    if (fading) return;
    if (triedForceQuit03 && notesRead && allClosed) setFading(true);
  }, [fading, triedForceQuit03, notesRead, allClosed]);

  useEffect(() => {
    if (!fading) return;
    const timer = window.setTimeout(() => {
      useGameStore.getState().setFlag('act3.started', true);
      setScene('windows');
    }, FADE_TO_BLACK_MS + BLACK_HOLD_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [fading, setScene]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black text-white">
      <MacDesktop />
      {macWindows.map((w) =>
        w.isMinimized ? null : <MacWindowFrame key={w.id} window={w} />,
      )}
      {fading ? (
        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: FADE_TO_BLACK_MS / 1000, ease: 'easeInOut' }}
          className="fixed inset-0 z-[10200] cursor-none select-none bg-black"
        />
      ) : null}
    </div>
  );
}