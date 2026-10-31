import { motion } from 'framer-motion';
import { useUiStore } from '@core/stores/uiStore';

const FADE_IN = { duration: 1.2, ease: 'easeOut' } as const;

export function ContentWarningScene() {
  const setScene = useUiStore((s) => s.setScene);

  return (
    <main className="flex h-full w-full flex-col items-center justify-center gap-10 bg-black px-6 text-center text-white">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={FADE_IN}
        className="flex max-w-xl flex-col gap-6"
      >
        <h1 className="text-xl font-bold tracking-[0.2em]">PERINGATAN KONTEN</h1>
        <p className="text-sm leading-relaxed text-neutral-200">
          Game ini mengandung elemen horror psikologis, tema kesehatan mental, burnout, dan
          keselamatan kerja.
        </p>
        <p className="text-sm leading-relaxed text-neutral-200">
          Tidak ada kekerasan grafis atau jumpscare.
        </p>
      </motion.div>
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...FADE_IN, delay: 0.6 }}
        onClick={() => setScene('menu')}
        autoFocus
        className="h-10 border border-neutral-500 bg-transparent px-8 text-xs font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10"
      >
        [ Saya Mengerti ]
      </motion.button>
    </main>
  );
}