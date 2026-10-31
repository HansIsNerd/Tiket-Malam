import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, resetSavedGame } from '@core/stores/gameStore';

const FIRST_LINE_MS = 1500;
const LINE_GAP_MS = 2000;
const CURSOR_HOLD_MS = 5000;
const FADE = { duration: 1.2, ease: 'easeOut' } as const;
const MONO_STACK = "'Courier New', Courier, Consolas, monospace";
const DIM = '#7A7A85';
const BRIGHT = '#C8C8D0';

interface LogLine {
  text: string;
  color: string;
}

function buildLines(playerName: string): readonly LogLine[] {
  return [
    { text: 'MENGAKHIRI SESI SHIFT MALAM...', color: DIM },
    { text: 'Menyimpan log akses lantai 4...', color: DIM },
    { text: 'Peringatan: Log tidak dapat disimpan. Akses ditolak.', color: DIM },
    { text: `Mengalihkan hak akses pengguna ${playerName}...`, color: DIM },
    { text: 'Hak akses dicabut.', color: DIM },
    { text: 'Menunggu pengguna baru...', color: DIM },
    { text: 'Tiket #4471 telah dialihkan ke: Bagas.p', color: BRIGHT },
  ];
}

export function EndScreen() {
  const playerName = useGameStore((s) => s.playerName);
  const lines = buildLines(playerName);
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const [showButton, setShowButton] = useState<boolean>(false);

  useEffect(() => {
    const total = buildLines('').length;
    const timers: number[] = [];
    for (let i = 0; i < total; i += 1) {
      timers.push(
        window.setTimeout(() => setVisibleCount(i + 1), FIRST_LINE_MS + i * LINE_GAP_MS),
      );
    }
    const lastLineAt = FIRST_LINE_MS + (total - 1) * LINE_GAP_MS;
    timers.push(window.setTimeout(() => setShowButton(true), lastLineAt + CURSOR_HOLD_MS));
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const handleRestart = () => {
    resetSavedGame();
    window.location.reload();
  };

  const allShown = visibleCount >= lines.length;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[10050] flex flex-col justify-between overflow-hidden bg-[#000000] p-8"
      style={{ fontFamily: MONO_STACK }}
    >
      <div className="flex flex-col gap-2 text-sm leading-relaxed">
        {lines.slice(0, visibleCount).map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={FADE}
            style={{ color: line.color }}
          >
            {line.text}
          </motion.p>
        ))}
        {allShown ? (
          <span aria-hidden="true" className="end-cursor-blink" style={{ color: DIM }}>
            _
          </span>
        ) : null}
      </div>

      <div className="flex h-8 items-end">
        {showButton ? (
          <motion.button
            type="button"
            onClick={handleRestart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
            className="border border-[#3a3a41] bg-transparent px-3 py-1.5 text-[11px] tracking-wider transition-colors hover:border-[#7A7A85] hover:text-[#C8C8D0]"
            style={{ color: DIM, fontFamily: MONO_STACK }}
          >
            [ Restart Terminal ]
          </motion.button>
        ) : null}
      </div>
    </div>
  );
}