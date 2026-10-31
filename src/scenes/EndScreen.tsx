import { motion } from 'framer-motion';
import { resetSavedGame } from '@core/stores/gameStore';

const FADE_IN = { duration: 2, ease: 'easeInOut' } as const;

export function EndScreen() {
  const handleRestart = () => {
    resetSavedGame();
    window.location.reload();
  };

  return (
    // z-index di atas Taskbar (9999), StartMenu (10000) dan toast (10001).
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Akhir demo"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={FADE_IN}
      className="fixed inset-0 z-[10050] flex flex-col items-center justify-center gap-12 bg-black text-white"
    >
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-6xl font-bold tracking-[0.2em]">TIKET MALAM</h1>
        <p className="text-sm text-neutral-400">Babak 2 akan datang.</p>
      </div>
      <button
        type="button"
        onClick={handleRestart}
        className="h-10 border border-neutral-500 bg-transparent px-8 text-xs font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10"
      >
        Main Lagi
      </button>
    </motion.div>
  );
}