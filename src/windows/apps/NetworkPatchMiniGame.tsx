import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { Network, X } from 'lucide-react';
import { audioService } from '@core/services/audioService';

type ColorId = 'red' | 'blue' | 'green' | 'yellow';

interface CableColor {
  id: ColorId;
  label: string;
  hex: string;
}

const COLORS: readonly CableColor[] = [
  { id: 'red', label: 'MERAH', hex: '#EF4444' },
  { id: 'blue', label: 'BIRU', hex: '#3B82F6' },
  { id: 'green', label: 'HIJAU', hex: '#22C55E' },
  { id: 'yellow', label: 'KUNING', hex: '#FACC15' },
];

const PANEL_W = 520;
const PANEL_H = 300;
const PORT_LEFT = 36;
const PORT_W = 64;
const PORT_H = 30;
const ROW_STEP = 60;
const LED_TOP0 = 44;
const PORT_TOP0 = LED_TOP0 + 14;
const SLOT_Y0 = PORT_TOP0 + PORT_H / 2;
const CONN_W = 44;
const CONN_H = 22;
const CABLE_START_X = 350;
const TAIL_X = PANEL_W - 14;
const SNAP_DISTANCE = 48;
const RESTORED_DELAY_MS = 1000;
const CLOSE_AFTER_RESTORED_MS = 1800;
const LED_OFF = '#DC2626';
const LED_ON = '#22C55E';
const MONO_STACK = "'Courier New', Courier, Consolas, monospace";
const SPRING = { type: 'spring', stiffness: 420, damping: 28 } as const;

type ConnectedMap = Record<ColorId, boolean>;

const INITIAL_CONNECTED: ConnectedMap = {
  red: false,
  blue: false,
  green: false,
  yellow: false,
};

interface SnapTarget {
  left: number;
  top: number;
}

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

function buildCableOrder(): CableColor[] {
  let order = shuffle(COLORS);
  let guard = 0;
  while (order.every((c, i) => c.id === COLORS[i]?.id) && guard < 10) {
    order = shuffle(COLORS);
    guard += 1;
  }
  return order;
}

function portTop(index: number): number {
  return PORT_TOP0 + index * ROW_STEP;
}

interface CableProps {
  cable: CableColor;
  slotIndex: number;
  connected: boolean;
  panelRef: RefObject<HTMLDivElement | null>;
  onRelease: (colorId: ColorId, centerX: number, centerY: number) => SnapTarget | null;
}

function Cable({ cable, slotIndex, connected, panelRef, onRelease }: CableProps) {
  const slotY = SLOT_Y0 + slotIndex * ROW_STEP;
  const startTop = slotY - CONN_H / 2;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [dragging, setDragging] = useState<boolean>(false);

  const path = useTransform([x, y], ([ox, oy]: number[]) => {
    const ex = CABLE_START_X + (ox ?? 0) + CONN_W;
    const ey = startTop + (oy ?? 0) + CONN_H / 2;
    return `M ${TAIL_X} ${slotY} C ${TAIL_X - 70} ${slotY + 28}, ${ex + 70} ${ey - 28}, ${ex} ${ey}`;
  });

  const handleDragEnd = () => {
    setDragging(false);
    const centerX = CABLE_START_X + x.get() + CONN_W / 2;
    const centerY = startTop + y.get() + CONN_H / 2;
    const snap = onRelease(cable.id, centerX, centerY);
    if (snap) {
      animate(x, snap.left - CABLE_START_X, SPRING);
      animate(y, snap.top - startTop, SPRING);
      return;
    }
    animate(x, 0, SPRING);
    animate(y, 0, SPRING);
  };

  return (
    <>
      <svg
        aria-hidden="true"
        width={PANEL_W}
        height={PANEL_H}
        className="pointer-events-none absolute left-0 top-0"
        style={{ zIndex: 2 }}
      >
        <motion.path
          d={path}
          fill="none"
          stroke="#000000"
          strokeOpacity={0.45}
          strokeWidth={8}
          strokeLinecap="round"
          transform="translate(0 2)"
        />
        <motion.path
          d={path}
          fill="none"
          stroke={cable.hex}
          strokeWidth={5}
          strokeLinecap="round"
        />
      </svg>

      <motion.div
        role="button"
        aria-label={`Kabel ${cable.label}${connected ? ' terpasang' : ''}`}
        drag={!connected}
        dragConstraints={panelRef}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={() => setDragging(true)}
        onDragEnd={handleDragEnd}
        whileDrag={{ scale: 1.06 }}
        style={{
          x,
          y,
          left: CABLE_START_X,
          top: startTop,
          width: CONN_W,
          height: CONN_H,
          zIndex: dragging ? 30 : connected ? 6 : 4,
          cursor: connected ? 'default' : dragging ? 'grabbing' : 'grab',
        }}
        className="absolute flex touch-none select-none overflow-hidden rounded-[3px] border border-black/70 shadow-[0_3px_6px_rgba(0,0,0,0.6)]"
      >
        <div className="flex w-[30px] items-center justify-center gap-[2px] bg-gradient-to-b from-neutral-300 to-neutral-500 px-1">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className="h-3.5 w-[2px] bg-amber-400/90" />
          ))}
        </div>
        <div className="flex-1" style={{ backgroundColor: cable.hex }} />
      </motion.div>
    </>
  );
}

interface NetworkPatchMiniGameProps {
  ticketId?: string;
  onComplete: () => void;
  onClose: () => void;
}

export function NetworkPatchMiniGame({ ticketId, onComplete, onClose }: NetworkPatchMiniGameProps) {
  const [cables] = useState<CableColor[]>(buildCableOrder);
  const [connected, setConnected] = useState<ConnectedMap>(INITIAL_CONNECTED);
  const [showRestored, setShowRestored] = useState<boolean>(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const completeRef = useRef<() => void>(onComplete);
  const completedRef = useRef<boolean>(false);

  completeRef.current = onComplete;

  const allConnected = COLORS.every((c) => connected[c.id]);

  useEffect(() => {
    if (!allConnected) return;
    const showTimer = window.setTimeout(() => setShowRestored(true), RESTORED_DELAY_MS);
    const doneTimer = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      completeRef.current();
    }, RESTORED_DELAY_MS + CLOSE_AFTER_RESTORED_MS);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(doneTimer);
    };
  }, [allConnected]);

  const handleRelease = (colorId: ColorId, centerX: number, centerY: number): SnapTarget | null => {
    if (connected[colorId]) return null;
    const portIndex = COLORS.findIndex((c) => c.id === colorId);
    if (portIndex < 0) return null;

    const portCenterX = PORT_LEFT + PORT_W / 2;
    const portCenterY = portTop(portIndex) + PORT_H / 2;
    const distance = Math.hypot(centerX - portCenterX, centerY - portCenterY);

    const nearest = COLORS.reduce(
      (best, _c, i) => {
        const d = Math.hypot(centerX - portCenterX, centerY - (portTop(i) + PORT_H / 2));
        return d < best.d ? { i, d } : best;
      },
      { i: -1, d: Number.POSITIVE_INFINITY },
    );

    if (nearest.i !== portIndex || distance > SNAP_DISTANCE) return null;

    setConnected((prev) => ({ ...prev, [colorId]: true }));
    audioService.playSFX('click');
    return {
      left: PORT_LEFT + 8,
      top: portTop(portIndex) + (PORT_H - CONN_H) / 2,
    };
  };

  const linkedCount = COLORS.filter((c) => connected[c.id]).length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Network Patch"
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="relative flex max-h-full flex-col overflow-hidden border border-neutral-500 bg-[var(--os-panel)] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--os-border)] pl-3 text-xs text-neutral-100">
          <span className="flex min-w-0 items-center gap-2">
            <Network size={14} strokeWidth={1.5} className="shrink-0" />
            <span className="truncate">{`Patch Panel${ticketId ? ` — #${ticketId}` : ''}`}</span>
          </span>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            disabled={allConnected}
            className="flex h-9 w-10 items-center justify-center transition-colors hover:bg-[#E81123] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>

        <div className="bg-black p-3">
          <div
            ref={panelRef}
            className="relative overflow-hidden rounded-md border border-neutral-600 bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),inset_0_-8px_20px_rgba(0,0,0,0.5)]"
            style={{ width: PANEL_W, height: PANEL_H }}
          >
            <div
              className="absolute inset-x-0 top-0 flex h-8 items-center justify-between border-b border-black/60 bg-black/30 px-4 text-[10px] tracking-[0.25em] text-neutral-400"
              style={{ fontFamily: MONO_STACK }}
            >
              <span>NX-2960 / 4-PORT SWITCH</span>
              <span className="tabular-nums">{`LINK ${linkedCount}/${COLORS.length}`}</span>
            </div>

            {[10, PANEL_W - 18].map((left) =>
              [8, PANEL_H - 16].map((top) => (
                <span
                  key={`${left}-${top}`}
                  aria-hidden="true"
                  className="absolute h-2 w-2 rounded-full border border-black/70 bg-neutral-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                  style={{ left, top }}
                />
              )),
            )}

            <div
              aria-hidden="true"
              className="absolute rounded-sm border border-black/60 bg-black/25"
              style={{
                left: PORT_LEFT - 14,
                top: LED_TOP0 - 10,
                width: PORT_W + 28,
                height: ROW_STEP * 3 + PORT_H + 40,
              }}
            />

            {COLORS.map((port, i) => {
              const done = connected[port.id];
              return (
                <div key={port.id}>
                  <motion.span
                    aria-label={done ? 'LED hijau' : 'LED merah'}
                    initial={false}
                    animate={{
                      backgroundColor: done ? LED_ON : LED_OFF,
                      boxShadow: done
                        ? '0 0 8px 2px rgba(34,197,94,0.8)'
                        : '0 0 6px 1px rgba(220,38,38,0.6)',
                    }}
                    transition={{ duration: 0.25 }}
                    className="absolute h-2.5 w-2.5 rounded-[2px] border border-black/70"
                    style={{ left: PORT_LEFT + PORT_W / 2 - 5, top: LED_TOP0 + i * ROW_STEP }}
                  />
                  <div
                    aria-label={`Port ${port.label}`}
                    className="absolute rounded-[3px] border border-neutral-600 bg-black shadow-[inset_0_3px_8px_rgba(0,0,0,0.9)]"
                    style={{
                      left: PORT_LEFT,
                      top: portTop(i),
                      width: PORT_W,
                      height: PORT_H,
                    }}
                  >
                    <div className="absolute inset-x-2 bottom-1 flex justify-between">
                      {Array.from({ length: 8 }, (_, k) => (
                        <span key={k} className="h-2 w-[2px] bg-amber-500/40" />
                      ))}
                    </div>
                  </div>
                  <span
                    aria-hidden="true"
                    className="absolute h-1 rounded-full"
                    style={{
                      left: PORT_LEFT + 8,
                      top: portTop(i) + PORT_H + 3,
                      width: PORT_W - 16,
                      backgroundColor: port.hex,
                      opacity: 0.85,
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute text-[9px] text-neutral-500"
                    style={{
                      left: PORT_LEFT + PORT_W + 8,
                      top: portTop(i) + 8,
                      fontFamily: MONO_STACK,
                    }}
                  >
                    {`P${i + 1}`}
                  </span>
                </div>
              );
            })}

            {cables.map((cable, slotIndex) => (
              <Cable
                key={cable.id}
                cable={cable}
                slotIndex={slotIndex}
                connected={connected[cable.id]}
                panelRef={panelRef}
                onRelease={handleRelease}
              />
            ))}
          </div>
        </div>

        {showRestored ? (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/85"
          >
            <span
              className="text-xl font-bold tracking-[0.3em] text-[#39FF14]"
              style={{ fontFamily: MONO_STACK, textShadow: '0 0 10px #39FF1499' }}
            >
              [ SYSTEM RESTORED ]
            </span>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}