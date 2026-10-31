import { motion } from 'framer-motion';
import { useUiStore } from '@core/stores/uiStore';

const WALLPAPER_URL =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920';
const BTN =
  'h-11 w-56 border border-neutral-500 bg-transparent text-xs font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10';

export function MainMenuScene() {
  const setScene = useUiStore((s) => s.setScene);

  const handleQuit = () => {
    console.log('[MainMenu] Keluar dipilih');
    window.alert('Tutup tab atau jendela ini untuk keluar.');
  };

  return (
    <main
      className="relative h-full w-full overflow-hidden bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${WALLPAPER_URL})` }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-14">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="text-6xl font-bold tracking-[0.2em]"
        >
          TIKET MALAM
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
          className="flex flex-col items-center gap-3"
        >
          <button type="button" autoFocus onClick={() => setScene('boot')} className={BTN}>
            Mulai Shift
          </button>
          <button type="button" onClick={handleQuit} className={BTN}>
            Keluar
          </button>
        </motion.div>
      </div>
    </main>
  );
}