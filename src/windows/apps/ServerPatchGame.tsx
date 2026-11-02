import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, DragEvent } from 'react';
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
  { id: 'red', label: 'MERAH', hex: '#FF3B3B' },
  { id: 'blue', label: 'BIRU', hex: '#3B82FF' },
  { id: 'green', label: 'HIJAU', hex: '#39FF14' },
  { id: 'yellow', label: 'KUNING', hex: '#FFE600' },
  { id: 'purple', label: 'UNGU', hex: '#B14BFF' },
  { id: 'orange', label: 'ORANYE', hex: '#FF8A00' },
];

const BASIC_COLOR_COUNT = 4;
const COMPLETE_DELAY_MS = 700;
const REBOOT_MS = 3000;
const REBOOT_DONE_DELAY_MS = 1500;
const ERROR_RESET_MS = 1200;
const ERROR_TEXT = 'ERR: COLOR_MISMATCH';
const RESTORED_TEXT = 'SIGNAL RESTORED';
const DEFAULT_TITLE = 'server_rack.exe';
const NEON = '#39FF14';
const MONO_STACK = "'Courier New', Courier, Consolas, monospace";

const GLOW_TEXT: CSSProperties = { textShadow: `0 0 6px ${NEON}88` };

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
  let statusClass = 'text-red-500';
  if (isTicket && rebootPhase === 'done') {
    statusText = RESTORED_TEXT;
    statusClass = 'font-semibold text-[#39FF14]';
  } else if (isTicket && allConnected && successMessage !== undefined && rebootPhase === 'idle') {
    statusText = successMessage;
    statusClass = 'font-semibold text-[#39FF14]';
  } else if (!isTicket && allConnected) {
    statusText = 'ALL_PORTS_LINKED';
    statusClass = 'font-semibold text-[#39FF14]';
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={heading}
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-4"
      style={{ fontFamily: MONO_STACK }}
    >
      <div
        className="flex max-h-full w-full max-w-lg flex-col overflow-y-auto border bg-black"
        style={{
          borderColor: `${NEON}99`,
          boxShadow: `0 0 24px ${NEON}33, inset 0 0 40px ${NEON}0D`,
        }}
      >
        <div
          className="flex h-9 shrink-0 items-center justify-between border-b pl-3 text-xs"
          style={{ borderColor: `${NEON}55`, color: NEON, ...GLOW_TEXT }}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Server size={14} strokeWidth={1.5} className="shrink-0" />
            <span className="truncate">
              {isTicket
                ? `root@rack:~# ${heading} [${stageLabel}/2]`
                : `root@rack:~# ${heading}`}
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
          <p className="text-[11px]" style={{ color: `${NEON}CC` }}>
            {'> patch --match-color <cable> <port>'}
            <span className="end-cursor-blink">_</span>
          </p>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <h3
                className="border-b pb-1 text-[10px] uppercase tracking-[0.25em]"
                style={{ borderColor: `${NEON}33`, color: `${NEON}99` }}
              >
                [ PORT ]
              </h3>
              {colors.map((port, idx) => {
                const done = connected[port.id];
                const armed = selected !== null && !done;
                return (
                  <button
                    key={port.id}
                    type="button"
                    onClick={() => handlePortClick(port.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, port.id)}
                    aria-label={`Port ${port.label}${done ? ' terhubung' : ''}`}
                    className={cx(
                      'flex h-10 items-center gap-3 border bg-black px-3 text-left text-[11px] transition-all',
                      armed && 'hover:bg-[#39FF14]/10',
                    )}
                    style={{
                      borderColor: done ? NEON : armed ? `${NEON}AA` : `${NEON}33`,
                      color: done ? NEON : `${NEON}99`,
                      boxShadow: done ? `0 0 10px ${NEON}88, inset 0 0 8px ${NEON}33` : undefined,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className={cx('h-2.5 w-2.5 shrink-0 rounded-full', done && 'animate-pulse')}
                      style={{
                        backgroundColor: done ? NEON : '#1a1a1a',
                        boxShadow: done ? `0 0 8px 2px ${NEON}` : 'inset 0 0 0 1px #333',
                      }}
                    />
                    <span className="tabular-nums opacity-60">{`P${idx + 1}`}</span>
                    <span
                      aria-hidden="true"
                      className="h-3 w-3 shrink-0 border"
                      style={{ backgroundColor: port.hex, borderColor: '#000' }}
                    />
                    <span className="flex-1 truncate">{port.label}</span>
                    {done ? <Check size={14} strokeWidth={2.5} style={{ color: NEON }} /> : null}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-2">
              <h3
                className="border-b pb-1 text-[10px] uppercase tracking-[0.25em]"
                style={{ borderColor: `${NEON}33`, color: `${NEON}99` }}
              >
                [ KABEL ]
              </h3>
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
                      'flex h-10 items-center gap-3 border bg-black px-3 text-left text-[11px] transition-all',
                      done ? 'cursor-default opacity-30' : 'cursor-grab hover:bg-[#39FF14]/10',
                    )}
                    style={{
                      borderColor: isSelected ? NEON : `${NEON}33`,
                      color: `${NEON}CC`,
                      boxShadow: isSelected ? `0 0 10px ${NEON}88` : undefined,
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-8 shrink-0 rounded-full"
                      style={{
                        backgroundColor: cable.hex,
                        boxShadow: `0 0 6px ${cable.hex}`,
                      }}
                    />
                    <span className="flex-1 truncate">{cable.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {isTicket && allConnected ? (
            <div
              className="flex flex-col gap-2 border-t pt-4"
              style={{ borderColor: `${NEON}33` }}
            >
              {rebootPhase === 'idle' ? (
                <button
                  type="button"
                  onClick={handleReboot}
                  className="h-10 border border-red-500 bg-black px-4 text-xs font-bold tracking-[0.2em] text-red-500 transition-colors hover:bg-red-600 hover:text-white"
                  style={{ boxShadow: '0 0 12px rgba(239,68,68,0.45)' }}
                >
                  $ sudo reboot --device
                </button>
              ) : null}
              {rebootPhase === 'rebooting' ? (
                <div role="status" className="flex flex-col gap-1.5">
                  <div
                    className="flex items-center justify-between text-[11px]"
                    style={{ color: `${NEON}CC` }}
                  >
                    <span>Rebooting device...</span>
                    <span className="tabular-nums">{Math.floor(progress)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden border" style={{ borderColor: `${NEON}55` }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: NEON,
                        boxShadow: `0 0 8px ${NEON}`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div
            className="flex h-5 items-center justify-between border-t pt-3 text-[11px]"
            style={{ borderColor: `${NEON}22` }}
          >
            <span role="alert" className={statusClass} style={statusClass.includes('39FF14') ? GLOW_TEXT : undefined}>
              {statusText}
            </span>
            <span className="tabular-nums" style={{ color: `${NEON}99` }}>
              LINK {connectedCount}/{colors.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}