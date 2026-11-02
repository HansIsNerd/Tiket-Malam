import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Printer, X } from 'lucide-react';
import { cx } from '@core/utils/cx';

type RowState = 'printing' | 'cancelled' | 'removed';
type Phase = 'cancelling' | 'ready' | 'restarting';

interface PrintJob {
  id: string;
  name: string;
  owner: string;
  size: string;
}

const JOBS: readonly PrintJob[] = [
  { id: 'job_1', name: 'Laporan_Q3.pdf', owner: 'rani', size: '2.4 MB' },
  { id: 'job_2', name: 'Foto_Kucing.jpg', owner: 'kevin', size: '5.1 MB' },
  { id: 'job_3', name: 'Doc_Revisi.docx', owner: 'bu_sari', size: '312 KB' },
  { id: 'job_4', name: 'Invoice_Oktober.xlsx', owner: 'kevin', size: '88 KB' },
  { id: 'job_5', name: 'Notulen_Rapat.pdf', owner: 'rani', size: '740 KB' },
];

const FADE_DELAY_MS = 600;
const RESTART_MS = 2000;
const MONO_STACK = "'Courier New', Courier, Consolas, monospace";
const ROW_GRID = 'grid grid-cols-[1.6fr_1fr_80px_90px] items-center gap-2 px-4';
const ACTION_BTN =
  'h-8 border border-neutral-500 bg-transparent px-4 text-xs font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

interface PrintSpoolerGameProps {
  ticketId?: string;
  onComplete: () => void;
  onClose: () => void;
}

export function PrintSpoolerGame({ ticketId, onComplete, onClose }: PrintSpoolerGameProps) {
  const [states, setStates] = useState<Record<string, RowState>>(() =>
    Object.fromEntries(JOBS.map((j) => [j.id, 'printing' as RowState])),
  );
  const [restarting, setRestarting] = useState<boolean>(false);
  const timersRef = useRef<number[]>([]);
  const completeRef = useRef<() => void>(onComplete);
  const completedRef = useRef<boolean>(false);

  completeRef.current = onComplete;

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const visibleJobs = JOBS.filter((j) => states[j.id] !== 'removed');
  const queueEmpty = visibleJobs.length === 0;
  const cancelledCount = JOBS.filter((j) => states[j.id] !== 'printing').length;
  const phase: Phase = restarting ? 'restarting' : queueEmpty ? 'ready' : 'cancelling';

  const handleCancel = (id: string) => {
    if (states[id] !== 'printing' || restarting) return;
    setStates((prev) => ({ ...prev, [id]: 'cancelled' }));
    timersRef.current.push(
      window.setTimeout(() => {
        setStates((prev) => ({ ...prev, [id]: 'removed' }));
      }, FADE_DELAY_MS),
    );
  };

  const handleRestart = () => {
    if (phase !== 'ready') return;
    setRestarting(true);
    timersRef.current.push(
      window.setTimeout(() => {
        if (completedRef.current) return;
        completedRef.current = true;
        completeRef.current();
      }, RESTART_MS),
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Print Spooler"
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="flex max-h-full w-full max-w-xl flex-col overflow-hidden border border-neutral-500 bg-[var(--os-panel)] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--os-border)] pl-3 text-xs text-neutral-100">
          <span className="flex min-w-0 items-center gap-2">
            <Printer size={14} strokeWidth={1.5} className="shrink-0" />
            <span className="truncate">{`Print Queue — HR-Printer${ticketId ? ` — #${ticketId}` : ''}`}</span>
          </span>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            disabled={restarting}
            className="flex h-9 w-10 items-center justify-center transition-colors hover:bg-[#E81123] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-col bg-[var(--os-bg)]">
          <div
            className={cx(
              ROW_GRID,
              'border-b border-[var(--os-border)] bg-[var(--os-panel)] py-2 text-[10px] uppercase tracking-wider text-neutral-500',
            )}
          >
            <span>Dokumen</span>
            <span>Pemilik</span>
            <span>Ukuran</span>
            <span className="text-right">Aksi</span>
          </div>

          <ul className="min-h-[220px]">
            <AnimatePresence initial={false}>
              {visibleJobs.map((job) => {
                const cancelled = states[job.id] === 'cancelled';
                return (
                  <motion.li
                    key={job.id}
                    layout
                    initial={{ opacity: 1 }}
                    animate={{ opacity: cancelled ? 0.3 : 1 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                    className="overflow-hidden border-b border-[var(--os-border)]"
                  >
                    <div
                      className={cx(ROW_GRID, 'h-11 text-xs')}
                      style={{ fontFamily: MONO_STACK }}
                    >
                      <span
                        className={cx(
                          'truncate',
                          cancelled ? 'text-neutral-500 line-through' : 'text-neutral-200',
                        )}
                      >
                        {job.name}
                      </span>
                      <span
                        className={cx(
                          'truncate',
                          cancelled ? 'text-neutral-600 line-through' : 'text-neutral-400',
                        )}
                      >
                        {job.owner}
                      </span>
                      <span
                        className={cx(
                          'tabular-nums',
                          cancelled ? 'text-neutral-600 line-through' : 'text-neutral-400',
                        )}
                      >
                        {job.size}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCancel(job.id)}
                        disabled={cancelled || restarting}
                        aria-label={`Cancel ${job.name}`}
                        className="justify-self-end border border-neutral-500 bg-transparent px-2.5 py-1 text-[11px] font-semibold text-neutral-200 transition-colors hover:bg-[#E81123] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
            {queueEmpty ? (
              <li className="flex h-[220px] items-center justify-center text-xs text-neutral-500">
                Antrean kosong
              </li>
            ) : null}
          </ul>
        </div>

        <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-t border-[var(--os-border)] bg-[var(--os-panel)] px-4">
          <span className="text-[11px] tabular-nums text-neutral-500">
            {phase === 'restarting' ? 'Restarting spooler...' : `${cancelledCount}/${JOBS.length} dibatalkan`}
          </span>
          {phase === 'restarting' ? (
            <span role="status" className="flex items-center gap-2 text-xs text-neutral-300">
              <motion.span
                aria-hidden="true"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                className="block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
              />
              Restarting spooler...
            </span>
          ) : (
            <button
              type="button"
              onClick={handleRestart}
              disabled={phase !== 'ready'}
              className={ACTION_BTN}
            >
              [ Restart Print Spooler ]
            </button>
          )}
        </div>
      </div>
    </div>
  );
}