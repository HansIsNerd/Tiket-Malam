import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cx } from '@core/utils/cx';

type CompletionWord = 'stop' | 'restart' | 'delete';
type Phase = 'choose' | 'error' | 'loading' | 'success';

const WORDS: readonly CompletionWord[] = ['stop', 'restart', 'delete'];
const CORRECT_WORD: CompletionWord = 'restart';
const LOADING_MS = 1800;
const SUCCESS_MS = 900;
const MONO_STACK = "'Courier New', Courier, Consolas, monospace";
const ACTION_BTN =
  'h-7 border border-neutral-500 bg-transparent px-3 text-[11px] font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10';

interface CodeCompletionGameProps {
  onComplete: () => void;
  onClose: () => void;
}

export function CodeCompletionGame({ onComplete, onClose }: CodeCompletionGameProps) {
  const [phase, setPhase] = useState<Phase>('choose');
  const [chosen, setChosen] = useState<CompletionWord | null>(null);
  const timersRef = useRef<number[]>([]);
  const completedRef = useRef<boolean>(false);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const schedule = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  const handlePick = (word: CompletionWord) => {
    if (phase === 'loading' || phase === 'success') return;
    setChosen(word);
    if (word !== CORRECT_WORD) {
      setPhase('error');
      return;
    }
    setPhase('loading');
    schedule(() => setPhase('success'), LOADING_MS);
    schedule(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete();
    }, LOADING_MS + SUCCESS_MS);
  };

  const busy = phase === 'loading' || phase === 'success';
  const slot = chosen ?? '____';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="vpn-service"
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="flex w-full max-w-lg flex-col border border-neutral-500 bg-[var(--os-panel)] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--os-border)] pl-3 text-xs text-neutral-100">
          <span className="truncate">vpn-service</span>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            disabled={busy}
            className="flex h-9 w-10 items-center justify-center transition-colors hover:bg-[#E81123] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div
          className="flex min-h-[132px] flex-col gap-2 bg-black p-4 text-[13px] leading-relaxed text-neutral-200"
          style={{ fontFamily: MONO_STACK }}
        >
          <p className="break-all">
            {'> systemctl '}
            <span
              className={cx(
                'inline-block border-b px-1',
                chosen
                  ? phase === 'error'
                    ? 'border-red-500 text-red-400'
                    : 'border-neutral-300 text-white'
                  : 'border-neutral-500 text-neutral-500',
              )}
            >
              {`[ ${slot} ]`}
            </span>
            {' vpn-service'}
          </p>

          {phase === 'error' ? (
            <p role="alert" className="font-semibold text-red-500">
              Command not found
            </p>
          ) : null}

          {phase === 'loading' ? (
            <p role="status" className="flex items-center gap-2 text-neutral-400">
              <motion.span
                aria-hidden="true"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                className="block h-3 w-3 rounded-full border-2 border-white/30 border-t-white"
              />
              Connecting...
            </p>
          ) : null}

          {phase === 'success' ? (
            <p role="status" className="font-semibold text-emerald-500">
              SUCCESS
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--os-border)] bg-[var(--os-panel)] px-4 py-3">
          {WORDS.map((word) => (
            <button
              key={word}
              type="button"
              disabled={busy}
              onClick={() => handlePick(word)}
              className="rounded-full border border-[var(--os-accent)] bg-transparent px-3 py-1.5 text-xs text-neutral-100 transition-colors hover:bg-[var(--os-accent)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              {word}
            </button>
          ))}
          <span className="flex-1" />
          <button type="button" onClick={onClose} disabled={busy} className={ACTION_BTN}>
            [ Batal ]
          </button>
        </div>
      </div>
    </div>
  );
}