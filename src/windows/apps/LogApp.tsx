import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, UIEvent } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { useNotificationStore } from '@core/stores/notificationStore';
import { triggerEnding } from '@core/services/endingService';
import { cx } from '@core/utils/cx';

interface LogRow {
  time: string;
  account: string;
  action: string;
  location: string;
}

type CompletionWord = 'restart' | 'stop' | 'delete';
type CompletionPhase = 'choose' | 'loading' | 'denied' | 'connecting' | 'done';

const MAX_ANOMALY_ROWS = 11;
const BOTTOM_THRESHOLD_PX = 8;
const COOLDOWN_MS = 700;
const LOADING_MS = 2000;
const CONNECTING_MS = 1400;
const FLICKER_MS = 1200;

const ERROR_ROW_LABEL = 'SYSTEM_FAILURE_AT_L4';
// >>> START PATCH
const RESTORED_ROW_LABEL = 'SYSTEM_RESTORED';
// <<< END PATCH
const WORDS: readonly CompletionWord[] = ['restart', 'stop', 'delete'];
const DENIED_TEXT = 'PERMISSION DENIED. PROSES 03:00 DILINDUNGI.';
const CONNECTING_TEXT = 'MENGHUBUNGI SERVER...';
const FLICKER_KEYFRAMES = [0, 1, 0, 0.85, 0, 1, 0];

const ANOMALY_ROW: LogRow = {
  time: '03:00:00',
  account: 'bagas.p',
  action: 'login',
  location: 'L4-PC-01',
};

const RESTART_ROW: LogRow = {
  time: '03:00:01',
  account: 'bagas.p',
  action: 'restart',
  location: 'L4-Service',
};

const ROW_GRID = 'grid grid-cols-[100px_1fr_100px_1fr] items-center gap-2 px-4';
const ACTION_BTN =
  'h-7 border border-neutral-500 bg-transparent px-3 text-[11px] font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10';
const MONO_STACK = "'Courier New', Courier, Consolas, monospace";

function buildNormalRows(playerName: string): LogRow[] {
  const me = playerName.trim().toLowerCase() || 'player';
  return [
    { time: '21:02:14', account: 'rani', action: 'login', location: 'IT-PC-02' },
    { time: '21:45:37', account: 'pak_darto', action: 'login', location: 'SEC-PC-01' },
    { time: '21:58:09', account: 'rani', action: 'logout', location: 'IT-PC-02' },
    { time: '22:00:03', account: me, action: 'login', location: 'IT-PC-01' },
    { time: '22:31:50', account: 'pak_darto', action: 'logout', location: 'SEC-PC-01' },
  ];
}

interface CodeCompletionModalProps {
  onClose: () => void;
  onRestart: () => void;
}

function CodeCompletionModal({ onClose, onRestart }: CodeCompletionModalProps) {
  const setFlag = useGameStore((s) => s.setFlag);
  const [phase, setPhase] = useState<CompletionPhase>('choose');
  const [chosen, setChosen] = useState<CompletionWord | null>(null);
  const [flicker, setFlicker] = useState<boolean>(false);
  const timersRef = useRef<number[]>([]);

  const schedule = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const handlePick = (word: CompletionWord) => {
    if (phase !== 'choose') return;
    setChosen(word);

    if (word === 'restart') {
      setPhase('connecting');
      schedule(() => setFlicker(true), CONNECTING_MS);
      schedule(() => {
        setFlicker(false);
        setPhase('done');
        onRestart();
      }, CONNECTING_MS + FLICKER_MS);
      return;
    }

    setPhase('loading');
    schedule(() => {
      setFlag('act2.processProtected', true);
      setPhase('denied');
    }, LOADING_MS);
  };

  const handleRetry = () => {
    setChosen(null);
    setPhase('choose');
  };

  const slot = chosen ?? '____';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ERROR_ROW_LABEL}
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="relative flex w-full max-w-lg flex-col border border-neutral-500 bg-[var(--os-panel)] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--os-border)] pl-3 text-xs text-neutral-100">
          <span className="truncate">{ERROR_ROW_LABEL}</span>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="flex h-9 w-10 items-center justify-center transition-colors hover:bg-[#E81123] hover:text-white"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div
          className="flex min-h-[132px] flex-col gap-2 bg-black p-4 text-[13px] leading-relaxed text-neutral-200"
          style={{ fontFamily: MONO_STACK }}
        >
          <p className="break-all">
            {'> sudo systemctl '}
            <span
              className={cx(
                'inline-block border-b px-1',
                chosen ? 'border-neutral-300 text-white' : 'border-neutral-500 text-neutral-500',
              )}
            >
              {`[ ${slot} ]`}
            </span>
            {' L4-Service'}
          </p>

          {phase === 'loading' ? (
            <p className="flex items-center gap-2 text-neutral-400" role="status">
              <motion.span
                aria-hidden="true"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                className="block h-3 w-3 rounded-full border-2 border-white/30 border-t-white"
              />
              Memproses...
            </p>
          ) : null}

          {phase === 'denied' ? (
            <p role="alert" className="font-semibold text-red-500">
              {DENIED_TEXT}
            </p>
          ) : null}

          {phase === 'connecting' ? (
            <p role="status" className="text-neutral-300">
              {CONNECTING_TEXT}
            </p>
          ) : null}

          {phase === 'done' ? (
            <p role="status" className="text-neutral-400">
              L4-Service: aktif.
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--os-border)] bg-[var(--os-panel)] px-4 py-3">
          {WORDS.map((word) => (
            <button
              key={word}
              type="button"
              disabled={phase !== 'choose'}
              onClick={() => handlePick(word)}
              className="rounded-full border border-[var(--os-accent)] bg-transparent px-3 py-1.5 text-xs text-neutral-100 transition-colors hover:bg-[var(--os-accent)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              {word}
            </button>
          ))}
          <span className="flex-1" />
          {phase === 'denied' ? (
            <button type="button" onClick={handleRetry} className={ACTION_BTN}>
              [ Coba Lagi ]
            </button>
          ) : null}
          {phase === 'denied' || phase === 'done' ? (
            <button type="button" onClick={onClose} className={ACTION_BTN}>
              [ Tutup ]
            </button>
          ) : null}
        </div>

        {flicker ? (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: FLICKER_KEYFRAMES }}
            transition={{ duration: FLICKER_MS / 1000, ease: 'linear' }}
            className="pointer-events-none fixed inset-0 z-[10150] bg-black"
          />
        ) : null}
      </div>
    </div>
  );
}

export function LogApp() {
  const playerName = useGameStore((s) => s.playerName);
  const scrollCount = useGameStore((s) => s.flags.act2.e02ScrollCount);
  const logRead = useGameStore((s) => s.flags.act2.e02LogRead);
  // >>> START PATCH
  const serverPatched = useGameStore((s) => s.flags.act1.serverPatched);
  // <<< END PATCH
  const setFlag = useGameStore((s) => s.setFlag);
  const lastTopRef = useRef<number>(0);
  const lastAddRef = useRef<number>(0);
  const countRef = useRef<number>(scrollCount);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [completionOpen, setCompletionOpen] = useState<boolean>(false);
  const [restartRows, setRestartRows] = useState<LogRow[]>([]);
  countRef.current = scrollCount;

  useEffect(() => {
    if (useGameStore.getState().flags.act2.e02LogOpened) return;
    setFlag('act2.e02LogOpened', true);
  }, [setFlag]);

  const normalRows = buildNormalRows(playerName);
  const anomalyRows = Array.from({ length: scrollCount }, () => ANOMALY_ROW);
  const showErrorRow = logRead;
  const resolved = restartRows.length > 0;
  // >>> START PATCH
  const restored = resolved || serverPatched;
  // <<< END PATCH

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const goingDown = el.scrollTop > lastTopRef.current;
    lastTopRef.current = el.scrollTop;
    if (!goingDown) return;

    const atBottom =
      el.scrollTop + el.clientHeight >= el.scrollHeight - BOTTOM_THRESHOLD_PX;
    if (!atBottom) return;
    if (countRef.current >= MAX_ANOMALY_ROWS) return;

    const now = Date.now();
    if (now - lastAddRef.current < COOLDOWN_MS) return;
    lastAddRef.current = now;

    const next = countRef.current + 1;
    countRef.current = next;
    setFlag('act2.e02ScrollCount', next);
  };

  const handleConfirmClear = () => {
    setConfirmOpen(false);
    triggerEnding('hapus');
  };

  const handleRestartDone = () => {
    setRestartRows((prev) => (prev.length > 0 ? prev : [RESTART_ROW]));
    useNotificationStore.getState().addNotification({
      title: 'bagas.p',
      message: 'Kamu menyalakannya lagi.',
      appId: 'chat',
    });
  };

  const openCompletion = () => {
    if (restored) return;
    setCompletionOpen(true);
  };

  const handleErrorRowKey = (e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openCompletion();
    }
  };

  const totalRows =
    normalRows.length + anomalyRows.length + restartRows.length + (showErrorRow ? 1 : 0);

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--os-bg)] text-neutral-100">
      <div className="flex h-10 shrink-0 items-center justify-end border-b border-[var(--os-border)] bg-[var(--os-panel)] px-3">
        <button type="button" onClick={() => setConfirmOpen(true)} className={ACTION_BTN}>
          [ Bersihkan Log ]
        </button>
      </div>

      <div
        className={cx(
          ROW_GRID,
          'shrink-0 border-b border-[var(--os-border)] bg-[var(--os-panel)] py-2 text-[10px] uppercase tracking-wider text-neutral-500',
        )}
      >
        <span>Waktu</span>
        <span>Akun</span>
        <span>Aksi</span>
        <span>Lokasi</span>
      </div>

      <div
        onScroll={handleScroll}
        className="chat-scroll min-h-0 flex-1 overflow-y-auto"
      >
        <div style={{ minHeight: 'calc(100% + 64px)' }}>
          <table className="w-full table-fixed border-collapse text-xs">
            <colgroup>
              <col style={{ width: '100px' }} />
              <col />
              <col style={{ width: '100px' }} />
              <col />
            </colgroup>
            <tbody>
              {normalRows.map((row, i) => (
                <tr
                  key={`normal-${i}`}
                  className="border-b border-[var(--os-border)] text-neutral-200"
                >
                  <td className="px-4 py-2.5 tabular-nums">{row.time}</td>
                  <td className="truncate px-2 py-2.5">{row.account}</td>
                  <td className="px-2 py-2.5">{row.action}</td>
                  <td className="truncate px-2 py-2.5">{row.location}</td>
                </tr>
              ))}
              {showErrorRow ? (
                // >>> START PATCH
                <tr
                  role={restored ? undefined : 'button'}
                  tabIndex={restored ? -1 : 0}
                  title={restored ? undefined : 'Klik untuk memeriksa'}
                  onClick={restored ? undefined : openCompletion}
                  onKeyDown={restored ? undefined : handleErrorRowKey}
                  className={cx(
                    'border-b border-[var(--os-border)] transition-colors duration-700',
                    restored
                      ? 'cursor-default bg-transparent text-green-500'
                      : 'cursor-pointer bg-red-950/30 text-red-400 hover:bg-red-950/50',
                  )}
                >
                  <td colSpan={4} className="px-4 py-2.5 font-semibold tracking-wider">
                    {restored ? RESTORED_ROW_LABEL : ERROR_ROW_LABEL}
                  </td>
                </tr>
                // <<< END PATCH
              ) : null}
              {anomalyRows.map((row, i) => (
                <motion.tr
                  key={`anomaly-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.6, ease: 'easeOut' }}
                  className="border-b border-[var(--os-border)] text-neutral-500"
                >
                  <td className="px-4 py-2.5 tabular-nums">{row.time}</td>
                  <td className="truncate px-2 py-2.5">{row.account}</td>
                  <td className="px-2 py-2.5">{row.action}</td>
                  <td className="truncate px-2 py-2.5">{row.location}</td>
                </motion.tr>
              ))}
              {restartRows.map((row, i) => (
                <motion.tr
                  key={`restart-${i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.6, ease: 'easeOut' }}
                  className="border-b border-[var(--os-border)] text-neutral-500"
                >
                  <td className="px-4 py-2.5 tabular-nums">{row.time}</td>
                  <td className="truncate px-2 py-2.5">{row.account}</td>
                  <td className="px-2 py-2.5">{row.action}</td>
                  <td className="truncate px-2 py-2.5">{row.location}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="flex h-7 shrink-0 items-center border-t border-[var(--os-border)] bg-[var(--os-panel)] px-3 text-[11px] text-neutral-500">
        {totalRows} entri
      </footer>

      {completionOpen ? (
        <CodeCompletionModal
          onClose={() => setCompletionOpen(false)}
          onRestart={handleRestartDone}
        />
      ) : null}

      {confirmOpen ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Konfirmasi bersihkan log"
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/60"
        >
          <div className="flex w-80 flex-col gap-5 border border-neutral-500 bg-[var(--os-panel)] p-5 text-xs text-neutral-200 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
            <p className="leading-relaxed">
              Hapus log_akses.csv secara permanen? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setConfirmOpen(false)}
                className={ACTION_BTN}
              >
                [ Batal ]
              </button>
              <button type="button" onClick={handleConfirmClear} className={ACTION_BTN}>
                [ Hapus ]
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}