import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useEndingStore } from '@core/stores/endingStore';
import type { EndingId } from '@core/stores/endingStore';
import { resetSavedGame } from '@core/stores/gameStore';

const FADE_DURATION_S = 3;
const LINE_STAGGER_S = 3.2;
const BUTTON_DELAY_MS = 10000;

const ENDING_LINES: Record<EndingId, readonly string[]> = {
  'lapor': [
    'Laporan diterima.',
    'Investigasi dimulai 3 hari kemudian.',
    'Kamu tidak dihubungi lagi.',
    'Bagas Prasetyo tidak ditemukan.',
  ],
  'hapus': [
    'Tiket #4471 ditutup.',
    'Kamu pulang.',
    'Besok pagi, tiket baru masuk: #4472.',
    'Printer L4 nyala sendiri.',
  ],
  'keluar': [
    'Kamu keluar gedung.',
    'Kunci mobilmu hilang.',
    'Jendela lantai 4 menyala.',
    'Kamu bisa kembali besok. Atau tidak.',
  ],
  'lanjut': [
    'Tidak ada yang perlu dikatakan.',
    'Kamu duduk di kursi Bagas.',
    'Selamat bekerja.',
  ]
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

  const handleBackToMenu = () => {
    resetSavedGame();
    window.location.reload();
  };

  if (ending === null) return null;

  const lines = ENDING_LINES[ending];

  return (
    <main
      role="status"
      aria-live="polite"
      className="relative flex h-full w-full flex-col items-center justify-center bg-black px-6 text-center text-neutral-300"
    >
      <div className="flex max-w-xl flex-col gap-4">
        {lines.map((line, i) => (
          <motion.p
            key={line}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: FADE_DURATION_S, delay: 1 + i * LINE_STAGGER_S, ease: 'easeOut' }}
            className="text-lg leading-relaxed"
          >
            {line}
          </motion.p>
        ))}
      </div>

      {showButton ? (
        <motion.button
          type="button"
          onClick={handleBackToMenu}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className="absolute bottom-6 right-6 h-10 border border-neutral-600 bg-transparent px-6 text-xs font-semibold tracking-wider text-neutral-400 transition-colors hover:bg-white/10"
        >
          [ Kembali ke Menu ]
        </motion.button>
      ) : null}
    </main>
  );
}