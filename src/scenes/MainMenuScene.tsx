import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useUiStore } from '@core/stores/uiStore';
import { useGameStore } from '@core/stores/gameStore';
const WALLPAPER_URL =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920';
const BTN =
  'h-11 w-56 border border-neutral-500 bg-transparent text-xs font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10';

  interface EndingEntry {
  id: string;
  label: string;
}

const ENDING_LIST: readonly EndingEntry[] = [
  { id: 'lapor', label: 'ENDING 1: Pahit Tapi Benar' },
  { id: 'hapus', label: 'ENDING 2: Selamat Tapi Kotor' },
  { id: 'keluar', label: 'ENDING 3: Ambigu' },
  { id: 'lanjut', label: 'SECRET: Workaholic' },
];

interface EndingGalleryProps {
  unlocked: readonly string[];
  onClose: () => void;
}

function EndingGallery({ unlocked, onClose }: EndingGalleryProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const unlockedCount = ENDING_LIST.filter((e) => unlocked.includes(e.id)).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Galeri Ending"
      onClick={onClose}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 p-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col border border-white/20 bg-[#1A1A1D]/95 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-md"
      >
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <h2 className="text-xs font-semibold tracking-[0.2em] text-neutral-100">
            GALERI ENDING
          </h2>
          <span className="text-[11px] tabular-nums text-neutral-500">
            {`${unlockedCount}/${ENDING_LIST.length}`}
          </span>
        </div>

        <ul className="flex flex-col">
          {ENDING_LIST.map((entry) => {
            const isUnlocked = unlocked.includes(entry.id);
            return (
              <li
                key={entry.id}
                className="flex h-12 items-center border-b border-white/10 px-4 text-sm last:border-b-0"
              >
                {isUnlocked ? (
                  <span className="text-neutral-100">{entry.label}</span>
                ) : (
                  <span className="text-neutral-600">??? — Belum ditemukan</span>
                )}
              </li>
            );
          })}
        </ul>

        <div className="flex shrink-0 items-center justify-end border-t border-white/10 px-4 py-3">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="h-8 border border-neutral-500 bg-transparent px-4 text-xs font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10"
          >
            [ Tutup ]
          </button>
        </div>
      </motion.div>
    </div>
  );
}
export function MainMenuScene() {
  const setScene = useUiStore((s) => s.setScene);
  const unlockedEndings = useGameStore((s) => s.unlockedEndings);
  const [galleryOpen, setGalleryOpen] = useState<boolean>(false);
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
          {/* >>> START PATCH */}
          <button type="button" onClick={() => setGalleryOpen(true)} className={BTN}>
            Galeri Ending
          </button>
          {/* <<< END PATCH */}
          <button type="button" onClick={handleQuit} className={BTN}>
            Keluar
          </button>
        </motion.div>
      </div>

      {galleryOpen ? (
        <EndingGallery unlocked={unlockedEndings} onClose={() => setGalleryOpen(false)} />
      ) : null}
    </main>
  );
}