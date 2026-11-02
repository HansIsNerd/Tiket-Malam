import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cx } from '@core/utils/cx';

type CompletionWord = 'stop' | 'restart' | 'delete';
type Phase = 'typing' | 'choose' | 'error' | 'executing' | 'success';

const WORDS: readonly CompletionWord[] = ['stop', 'restart', 'delete'];
const CORRECT_WORD: CompletionWord = 'restart';
const MONO_STACK = "'Courier New', Courier, Consolas, monospace";
const COMMAND_PREFIX = '> systemctl ';
const COMMAND_SUFFIX = ' vpn-service';
const COMMAND_FULL = `${COMMAND_PREFIX}status${COMMAND_SUFFIX}`;
const TYPE_INTERVAL_MS = 55;
const TYPE_START_DELAY_MS = 400;
const LINE_INTERVAL_MS = 500;
const CLOSE_AFTER_SUCCESS_MS = 1200;
const ACTION_BTN =
  'h-7 border border-neutral-500 bg-transparent px-3 text-[11px] font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10';

interface ExecLine {
  tag: 'plain' | 'ok' | 'success';
  text: string;
}

const EXEC_LINES: readonly ExecLine[] = [
  { tag: 'plain', text: '> executing command...' },
  { tag: 'ok', text: 'Stopping VPN Daemon...' },
  { tag: 'ok', text: 'Clearing socket buffers...' },
  { tag: 'ok', text: 'Starting VPN Daemon...' },
  { tag: 'success', text: 'VPN RESTORED.' },
];

interface CodeCompletionGameProps {
  onComplete: () => void;
  onClose: () => void;
}

function renderExecLine(line: ExecLine, index: number) {
  if (line.tag === 'plain') {
    return (
      <p key={index} className="text-neutral-400">
        {line.text}
      </p>
    );
  }
  if (line.tag === 'ok') {
    return (
      <p key={index} className="break-all">
        <span className="font-semibold text-emerald-500">{'[ OK ]'}</span>
        {` ${line.text}`}
      </p>
    );
  }
  return (
    <p key={index} className="break-all font-semibold text-emerald-400">
      {`[ SUCCESS ] ${line.text}`}
    </p>
  );
}

export function CodeCompletionGame({ onComplete, onClose }: CodeCompletionGameProps) {
  const [phase, setPhase] = useState<Phase>('typing');
  const [chosen, setChosen] = useState<CompletionWord | null>(null);
  const [typedCount, setTypedCount] = useState<number>(0);
  const [execCount, setExecCount] = useState<number>(0);
  const timersRef = useRef<number[]>([]);
  const completedRef = useRef<boolean>(false);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => {
        window.clearTimeout(t);
        window.clearInterval(t);
      });
    };
  }, []);

  useEffect(() => {
    let interval: number | null = null;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setTypedCount((c) => {
          const next = c + 1;
          if (next >= COMMAND_FULL.length && interval !== null) {
            window.clearInterval(interval);
            interval = null;
            setPhase((p) => (p === 'typing' ? 'choose' : p));
          }
          return Math.min(next, COMMAND_FULL.length);
        });
      }, TYPE_INTERVAL_MS);
    }, TYPE_START_DELAY_MS);
    return () => {
      window.clearTimeout(start);
      if (interval !== null) window.clearInterval(interval);
    };
  }, []);

  const schedule = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  const handlePick = (word: CompletionWord) => {
    if (phase !== 'choose' && phase !== 'error') return;
    setChosen(word);
    if (word !== CORRECT_WORD) {
      setPhase('error');
      return;
    }
    setPhase('executing');
    setExecCount(0);
    EXEC_LINES.forEach((_, i) => {
      schedule(() => setExecCount(i + 1), LINE_INTERVAL_MS * (i + 1));
    });
    schedule(() => {
      setPhase('success');
    }, LINE_INTERVAL_MS * EXEC_LINES.length);
    schedule(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete();
    }, LINE_INTERVAL_MS * EXEC_LINES.length + CLOSE_AFTER_SUCCESS_MS);
  };

  const busy = phase === 'typing' || phase === 'executing' || phase === 'success';
  const isTyping = phase === 'typing';
  const showSlot = !isTyping;
  const slot = chosen ?? '____';
  const typedText = COMMAND_FULL.slice(0, typedCount);

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
            disabled={phase === 'executing' || phase === 'success'}
            className="flex h-9 w-10 items-center justify-center transition-colors hover:bg-[#E81123] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div
          className="flex min-h-[176px] flex-col gap-1.5 bg-black p-4 text-[13px] leading-relaxed text-neutral-200"
          style={{ fontFamily: MONO_STACK }}
        >
          {isTyping ? (
            <p className="break-all">
              {typedText}
              <span aria-hidden="true" className="end-cursor-blink text-neutral-400">
                _
              </span>
            </p>
          ) : (
            <p className="break-all">
              {COMMAND_PREFIX}
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
                {showSlot ? `[ ${slot} ]` : ''}
              </span>
              {COMMAND_SUFFIX}
            </p>
          )}

          {phase === 'error' ? (
            <p role="alert" className="font-semibold text-red-500">
              Command not found
            </p>
          ) : null}

          {phase === 'executing' || phase === 'success' ? (
            <div role="status" className="flex flex-col gap-1">
              {EXEC_LINES.slice(0, execCount).map(renderExecLine)}
              {phase === 'executing' && execCount < EXEC_LINES.length ? (
                <span aria-hidden="true" className="end-cursor-blink text-neutral-400">
                  _
                </span>
              ) : null}
            </div>
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