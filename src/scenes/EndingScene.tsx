import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useEndingStore } from '@core/stores/endingStore';
import type { EndingId } from '@core/stores/endingStore';
import { resetSavedGame } from '@core/stores/gameStore';

const FADE_IN = { duration: 2, ease: 'easeOut' } as const;
const BUTTON_DELAY_MS = 6000;

const ENDING_TEXT: Record<EndingId, string> = {
  keluar: 'Kamu bisa kembali besok. Atau tidak.',
};

export function EndingScene() {
  const ending = useEndingStore((s) => s.ending);
  const [showButton, setShowButton] = useState<boolean>(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowButton(true), BUTTON_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  const handleRestart = () => {
    resetSavedGame();
    window.location.reload();
  };

  if (ending === null) return null;

  return (
    <main
      role="status"
      aria-live="polite"
      className="flex h-full w-full flex-col items-center justify-center gap-12 bg-black px-6 text-center text-neutral-300"
    >
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={FADE_IN}
        className="max-w-xl text-lg leading-relaxed"
      >
        {ENDING_TEXT[ending]}
      </motion.p>
      <div className="flex h-10 items-center">
        {showButton ? (
          <motion.button
            type="button"
            onClick={handleRestart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="h-10 border border-neutral-600 bg-transparent px-6 text-xs font-semibold tracking-wider text-neutral-400 transition-colors hover:bg-white/10"
          >
            [ Mulai Ulang ]
          </motion.button>
        ) : null}
      </div>
    </main>
  );
}