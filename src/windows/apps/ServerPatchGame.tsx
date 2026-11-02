import { useEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { Check, Server, X } from 'lucide-react';
import { cx } from '@core/utils/cx';

type ColorId = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

interface ColorMeta {
  id: ColorId;
  label: string;
  hex: string;
}

type RebootPhase = 'idle' | 'rebooting' | 'done';

const ALL_COLORS: readonly ColorMeta[] = [
  { id: 'red', label: 'Merah', hex: '#DC2626' },
  { id: 'blue', label: 'Biru', hex: '#2563EB' },
  { id: 'green', label: 'Hijau', hex: '#16A34A' },
  { id: 'yellow', label: 'Kuning', hex: '#EAB308' },
  { id: 'purple', label: 'Ungu', hex: '#9333EA' },
  { id: 'orange', label: 'Oranye', hex: '#EA580C' },
];

const BASIC_COLOR_COUNT = 4;
const COMPLETE_DELAY_MS = 700;
const REBOOT_MS = 3000;
const REBOOT_DONE_DELAY_MS = 1500;
const ERROR_RESET_MS = 1200;
const ERROR_TEXT = 'Warna tidak cocok.';
const RESTORED_TEXT = 'SIGNAL RESTORED';
const DEFAULT_TITLE = 'server_rack.exe';

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = a;
  }
  return copy;
}

function buildCableOrder(colors: readonly ColorMeta[]): ColorMeta[] {
  let order = shuffle(colors);
  let guard = 0;
  while (order.every((c, i) => c.id === colors[i]?.id) && guard < 10) {
    order = shuffle(colors);
    guard += 1;
  }
  return order;
}

type ConnectedMap = Record<ColorId, boolean>;

const INITIAL_CONNECTED: ConnectedMap = {
  red: false,
  blue: false,
  green: false,
  yellow: false,
  purple: false,
  orange: false,
};

interface ServerPatchGameProps {
  onComplete: () => void;
  onClose: () => void;
  title?: string;
  successMessage?: string;
  ticketMode?: boolean;
}

export function ServerPatchGame({
  onComplete,
  onClose,
  title,
  successMessage,
  ticketMode,
}: ServerPatchGameProps) {
  const isTicket = ticketMode ?? successMessage !== undefined;
  const colors: readonly ColorMeta[] = isTicket ? ALL_COLORS : ALL_COLORS.slice(0, BASIC_COLOR_COUNT);

  const [cables] = useState<ColorMeta[]>(() => buildCableOrder(colors));
  const [connected, setConnected] = useState<ConnectedMap>(INITIAL_CONNECTED);
  const [selected, setSelected] = useState<ColorId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rebootPhase, setRebootPhase] = useState<RebootPhase>('idle');
  const [progress, setProgress] = useState<number>(0);
  const errorTimerRef = useRef<number | null>(null);
  const completedRef = useRef<boolean>(false);

  const allConnected = colors.every((c) => connected[c.id]);
  const heading = title ?? DEFAULT_TITLE;
  const connectedCount = colors.filter((c) => connected[c.id]).length;
  const stageLabel = rebootPhase === 'idle' && !allConnected ? 1 : 2;

  useEffect(() => {
    return () => {
      if (errorTimerRef.current !== null) window.clearTimeout(errorTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isTicket || !allConnected || completedRef.current) return;
    const timer = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete();
    }, COMPLETE_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [allConnected, isTicket, onComplete]);

  useEffect(() => {
    if (rebootPhase !== 'rebooting') return;
    const start = Date.now();
    const interval = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / REBOOT_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        window.clearInterval(interval);
        setRebootPhase('done');
      }
    }, 50);
    return () => {
      window.clearInterval(interval);
    };
  }, [rebootPhase]);

  useEffect(() => {
    if (rebootPhase !== 'done' || completedRef.current) return;
    const timer = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onComplete();
    }, REBOOT_DONE_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [rebootPhase, onComplete]);

  const showError = () => {
    setError(ERROR_TEXT);
    if (errorTimerRef.current !== null) window.clearTimeout(errorTimerRef.current);
    errorTimerRef.current = window.setTimeout(() => {
      setError(null);
      errorTimerRef.current = null;
    }, ERROR_RESET_MS);
  };

  const tryConnect = (portId: ColorId, cableId: ColorId) => {
    if (connected[cableId] || connected[portId]) return;
    if (portId === cableId) {
      setConnected((prev) => ({ ...prev, [cableId]: true }));
      setSelected(null);
      setError(null);
      return;
    }
    setSelected(null);
    showError();
  };

  const handlePortClick = (portId: ColorId) => {
    if (selected === null) return;
    tryConnect(portId, selected);
  };

  const handleCableClick = (cableId: ColorId) => {
    if (connected[cableId]) return;
    setSelected((prev) => (prev === cableId ? null : cableId));
    setError(null);
  };

  const handleDragStart = (e: DragEvent<HTMLButtonElement>, cableId: ColorId) => {
    if (connected[cableId]) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', cableId);
    e.dataTransfer.effectAllowed = 'move';
    setSelected(cableId);
  };

  const handleDrop = (e: DragEvent<HTMLButtonElement>, portId: ColorId) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('text/plain');
    const cable = colors.find((c) => c.id === raw);
    if (!cable) return;
    tryConnect(portId, cable.id);
  };

  const handleReboot = () => {
    if (rebootPhase !== 'idle') return;
    setProgress(0);
    setRebootPhase('rebooting');
  };

  let statusText = error ?? '';
  let statusClass = 'text-red-400';
  if (isTicket && rebootPhase === 'done') {
    statusText = RESTORED_TEXT;
    statusClass = 'font-semibold text-emerald-400';
  } else if (isTicket && allConnected && successMessage !== undefined && rebootPhase === 'idle') {
    statusText = successMessage;
    statusClass = 'font-semibold text-emerald-400';
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="flex max-h-full w-full max-w-lg flex-col overflow-y-auto border border-neutral-500 bg-[var(--os-panel)] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--os-border)] pl-3 text-xs text-neutral-100">
          <span className="flex min-w-0 items-center gap-2">
            <Server size={14} strokeWidth={1.5} className="shrink-0" />
            <span className="truncate">
              {isTicket ? `${heading} — Tahap ${stageLabel}/2` : heading}
            </span>
          </span>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            disabled={rebootPhase === 'rebooting'}
            className="flex h-9 w-10 items-center justify-center transition-colors hover:bg-[#E81123] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <p className="text-xs text-neutral-400">
            Sambungkan setiap kabel ke port dengan warna yang sama.
          </p>

          <div className="grid grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <h3 className="text-[10px] uppercase tracking-wider text-neutral-500">Port</h3>
              {colors.map((port) => {
                const done = connected[port.id];
                return (
                  <button
                    key={port.id}
                    type="button"
                    onClick={() => handlePortClick(port.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, port.id)}
                    aria-label={`Port ${port.label}${done ? ' terhubung' : ''}`}
                    className={cx(
                      'flex h-10 items-center gap-3 border bg-[var(--os-bg)] px-3 text-left text-xs text-neutral-200 transition-colors',
                      done
                        ? 'border-emerald-500/60'
                        : selected !== null
                          ? 'border-neutral-300 hover:bg-white/10'
                          : 'border-[var(--os-border)]',
                    )}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full ring-2 ring-black/40"
                      style={{ backgroundColor: port.hex }}
                    />
                    <span className="flex-1 truncate">{port.label}</span>
                    {done ? <Check size={14} strokeWidth={2.5} className="text-emerald-500" /> : null}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-[10px] uppercase tracking-wider text-neutral-500">Kabel</h3>
              {cables.map((cable) => {
                const done = connected[cable.id];
                const isSelected = selected === cable.id;
                return (
                  <button
                    key={cable.id}
                    type="button"
                    draggable={!done}
                    onDragStart={(e) => handleDragStart(e, cable.id)}
                    onDragEnd={() => setSelected(null)}
                    onClick={() => handleCableClick(cable.id)}
                    disabled={done}
                    aria-label={`Kabel ${cable.label}${done ? ' terpasang' : ''}`}
                    aria-pressed={isSelected}
                    className={cx(
                      'flex h-10 items-center gap-3 border bg-[var(--os-bg)] px-3 text-left text-xs text-neutral-200 transition-colors',
                      done
                        ? 'cursor-default border-[var(--os-border)] opacity-30'
                        : isSelected
                          ? 'cursor-grab border-white bg-white/10'
                          : 'cursor-grab border-[var(--os-border)] hover:bg-white/10',
                    )}
                  >
                    <span
                      className="h-2 w-8 shrink-0 rounded-full"
                      style={{ backgroundColor: cable.hex }}
                    />
                    <span className="flex-1 truncate">{cable.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {isTicket && allConnected ? (
            <div className="flex flex-col gap-2 border-t border-[var(--os-border)] pt-4">
              {rebootPhase === 'idle' ? (
                <button
                  type="button"
                  onClick={handleReboot}
                  className="h-10 bg-red-600 px-4 text-xs font-bold tracking-wider text-white transition-colors hover:bg-red-500"
                >
                  REBOOT DEVICE
                </button>
              ) : null}
              {rebootPhase === 'rebooting' ? (
                <div role="status" className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Rebooting device...</span>
                    <span className="tabular-nums">{Math.floor(progress)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden bg-black/60">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex h-5 items-center justify-between text-[11px]">
            <span role="alert" className={statusClass}>
              {statusText}
            </span>
            <span className="tabular-nums text-neutral-500">
              {connectedCount}/{colors.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}