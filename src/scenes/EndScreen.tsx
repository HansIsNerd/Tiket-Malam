import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { resetSavedGame } from '@core/stores/gameStore';

const FADE_IN = { duration: 2, ease: 'easeInOut' } as const;
const WAIT_MS = 5000;
const STEP_OFFSETS_MS: readonly number[] = [0, 3000, 4500, 6000, 7500, 9500, 13000];
const COUNTDOWN: readonly string[] = ['3...', '2...', '1...'];
const OVERLAY_CLASS =
  'fixed inset-0 z-[10050] flex flex-col items-center justify-center bg-black text-white';

type Phase = 'wait' | 'message' | 'final';

function FadeLine({ children }: { children: string }) {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={FADE_IN}
      className="text-base tracking-wide text-neutral-200"
    >
      {children}
    </motion.p>
  );
}

export function EndScreen() {
  const [phase, setPhase] = useState<Phase>('wait');
  const [step, setStep] = useState<number>(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase('message'), WAIT_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'message') return;
    const lastIndex = STEP_OFFSETS_MS.length - 1;
    const timers = STEP_OFFSETS_MS.map((offset, i) =>
      window.setTimeout(() => {
        setStep(i + 1);
        if (i === lastIndex) setPhase('final');
      }, offset),
    );
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [phase]);

  const handleRestart = () => {
    resetSavedGame();
    window.location.reload();
  };

  if (phase === 'wait') return <div aria-hidden="true" className={OVERLAY_CLASS} />;

  if (phase === 'message') {
    const shown = COUNTDOWN.slice(0, Math.max(0, step - 2));
    return (
      <div role="status" aria-live="polite" className={`${OVERLAY_CLASS} gap-6`}>
        {step >= 1 ? <FadeLine>Kamu telah menyelesaikan Vertical Slice.</FadeLine> : null}
        {step >= 2 ? (
          <FadeLine>{`Layar akan mati dalam ${shown.join(' ')}`.trim()}</FadeLine>
        ) : null}
        {step >= 6 ? <FadeLine>Terima kasih sudah bermain.</FadeLine> : null}
      </div>
    );
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Akhir demo"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={FADE_IN}
      className={`${OVERLAY_CLASS} gap-12`}
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