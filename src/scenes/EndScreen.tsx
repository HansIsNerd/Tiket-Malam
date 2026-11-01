import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore, resetSavedGame } from '@core/stores/gameStore';

const FIRST_LINE_MS = 1500;
const CHAR_MS = 34;
const CHAR_JITTER_MS = 28;
const LINE_PAUSE_MS = 650;
const CURSOR_HOLD_MS = 5000;
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
  const lines = useMemo(() => buildLines(playerName), [playerName]);
  const [lineIdx, setLineIdx] = useState<number>(0);
  const [charIdx, setCharIdx] = useState<number>(0);
  const [showButton, setShowButton] = useState<boolean>(false);

  const allDone = lineIdx >= lines.length;

  useEffect(() => {
    if (allDone) return;
    const line = lines[lineIdx];
    if (!line) return;

    let delay: number;
    let onTick: () => void;

    if (charIdx < line.text.length) {
      delay =
        lineIdx === 0 && charIdx === 0
          ? FIRST_LINE_MS
          : CHAR_MS + Math.random() * CHAR_JITTER_MS;
      onTick = () => setCharIdx((c) => c + 1);
    } else {
      delay = LINE_PAUSE_MS;
      onTick = () => {
        setLineIdx((i) => i + 1);
        setCharIdx(0);
      };
    }

    const timer = window.setTimeout(onTick, delay);
    return () => {
      window.clearTimeout(timer);
    };
  }, [lineIdx, charIdx, lines, allDone]);

  useEffect(() => {
    if (!allDone) return;
    const timer = window.setTimeout(() => setShowButton(true), CURSOR_HOLD_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [allDone]);

  const handleRestart = () => {
    resetSavedGame();
    window.location.reload();
  };

  const typingLine = allDone ? null : (lines[lineIdx] ?? null);
  const isTyping = typingLine !== null && charIdx < typingLine.text.length;
  const showCursorInline = typingLine !== null && (lineIdx > 0 || charIdx > 0);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[10050] flex flex-col justify-between overflow-hidden bg-[#000000] p-8"
      style={{ fontFamily: MONO_STACK }}
    >
      <div className="flex flex-col gap-2 text-sm leading-relaxed">
        {lines.slice(0, lineIdx).map((line, i) => (
          <p key={i} style={{ color: line.color }}>
            {line.text}
          </p>
        ))}
        {typingLine !== null ? (
          <p style={{ color: typingLine.color, minHeight: '1.5em' }}>
            {typingLine.text.slice(0, charIdx)}
            {showCursorInline || charIdx > 0 ? (
              <span
                aria-hidden="true"
                className={isTyping ? undefined : 'end-cursor-blink'}
                style={{ color: DIM, display: 'inline-block' }}
              >
                _
              </span>
            ) : null}
          </p>
        ) : null}
        {allDone ? (
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