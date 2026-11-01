import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@core/stores/gameStore';
import { cx } from '@core/utils/cx';

type CameraId = 'lobby' | 'pantri' | 'l4_koridor' | 'l4_rapat';

interface CameraMeta {
  id: CameraId;
  label: string;
}

const CAMERAS: readonly CameraMeta[] = [
  { id: 'lobby', label: 'Lobby' },
  { id: 'pantri', label: 'Pantri' },
  { id: 'l4_koridor', label: 'L4-Koridor' },
  { id: 'l4_rapat', label: 'L4-Rapat' },
];

const LIVE_POS = 100;
const CHAIR_FROM = 40;
const SILHOUETTE_FROM = 55;
const SILHOUETTE_TO = 75;
const DARTO_FREEZE_FROM = 70;
const DAY_MINUTES = 24 * 60;

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (Number.isFinite(h) ? (h as number) : 0) * 60 + (Number.isFinite(m) ? (m as number) : 0);
}

function formatMinutes(total: number): string {
  const wrapped = ((total % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const h = String(Math.floor(wrapped / 60)).padStart(2, '0');
  const m = String(wrapped % 60).padStart(2, '0');
  return `${h}:${m}`;
}

interface FeedProps {
  camera: CameraMeta;
  stamp: string;
  position: number;
  chairMoved: boolean;
  silhouette: boolean;
  dartoFrozen: boolean;
}

function Feed({ camera, stamp, position, chairMoved, silhouette, dartoFrozen }: FeedProps) {
  const showChairShift = camera.id === 'l4_rapat' && chairMoved && position >= CHAIR_FROM;
  const showSilhouette =
    camera.id === 'l4_rapat' &&
    silhouette &&
    position >= SILHOUETTE_FROM &&
    position <= SILHOUETTE_TO;
  const showDarto = camera.id === 'lobby';
  const frozen = showDarto && dartoFrozen && position >= DARTO_FREEZE_FROM;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-neutral-800">
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-700/30 to-black/50" />

      {camera.id === 'l4_rapat' ? (
        <>
          <div className="absolute left-1/2 top-1/2 h-10 w-40 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-neutral-700/80" />
          <motion.div
            aria-label={showChairShift ? 'Kursi bergeser' : 'Kursi'}
            animate={{ x: showChairShift ? 34 : 0, rotate: showChairShift ? 14 : 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute left-[38%] top-[62%] h-7 w-7 rounded-sm bg-neutral-600"
          />
          <div className="absolute left-[58%] top-[62%] h-7 w-7 rounded-sm bg-neutral-600" />
        </>
      ) : null}

      {showSilhouette ? (
        <motion.div
          aria-label="Siluet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.85 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute bottom-[14%] left-[46%] flex flex-col items-center blur-[1.5px]"
        >
          <div className="h-6 w-6 rounded-full bg-black" />
          <div className="-mt-0.5 h-14 w-10 rounded-t-xl bg-black" />
        </motion.div>
      ) : null}

      {showDarto ? (
        <motion.div
          aria-label={frozen ? 'Pak Darto tidak bergerak' : 'Pak Darto'}
          animate={frozen ? { x: 0 } : { x: [0, 28, 0, -28, 0] }}
          transition={frozen ? { duration: 0 } : { duration: 14, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-[14%] left-[42%] flex flex-col items-center"
        >
          <div className="h-5 w-5 rounded-full bg-neutral-400" />
          <div className="-mt-0.5 h-12 w-9 rounded-t-xl bg-neutral-500" />
        </motion.div>
      ) : null}

      {frozen ? (
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.05)_0px,rgba(255,255,255,0.05)_1px,transparent_1px,transparent_3px)]" />
      ) : null}

      <div className="relative z-10 flex items-start justify-between p-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-300">
        <span>{camera.label}</span>
        <span className="flex items-center gap-1 tabular-nums">
          <span
            className={cx(
              'h-1.5 w-1.5 rounded-full',
              position === LIVE_POS ? 'bg-red-500' : 'bg-neutral-500',
            )}
          />
          {position === LIVE_POS ? 'LIVE' : 'REC'} {stamp}
        </span>
      </div>
      {frozen ? (
        <span className="relative z-10 mt-auto p-2 text-[10px] uppercase tracking-wider text-neutral-500">
          Frame tidak berubah
        </span>
      ) : null}
    </div>
  );
}

export function CctvApp() {
  const timeCurrent = useGameStore((s) => s.timeCurrent);
  const cctvOpened = useGameStore((s) => s.flags.act2.cctvOpened);
  const chairMoved = useGameStore((s) => s.flags.act2.e06CctvChair);
  const silhouette = useGameStore((s) => s.flags.act2.e07CctvSilhouette);
  const dartoFrozen = useGameStore((s) => s.flags.act2.e08CctvDartoStatic);
  const setFlag = useGameStore((s) => s.setFlag);
  const [position, setPosition] = useState<number>(LIVE_POS);

  useEffect(() => {
    if (cctvOpened) return;
    setFlag('act2.cctvOpened', true);
  }, [cctvOpened, setFlag]);

  const stamp = formatMinutes(parseMinutes(timeCurrent) - (LIVE_POS - position));

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPosition(Number(e.target.value));
  };

  return (
    <div className="flex h-full w-full flex-col bg-[var(--os-bg)] text-neutral-100">
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-px bg-[var(--os-border)]">
        {CAMERAS.map((camera) => (
          <Feed
            key={camera.id}
            camera={camera}
            stamp={stamp}
            position={position}
            chairMoved={chairMoved}
            silhouette={silhouette}
            dartoFrozen={dartoFrozen}
          />
        ))}
      </div>

      <div className="flex h-14 shrink-0 items-center gap-3 border-t border-[var(--os-border)] bg-[var(--os-panel)] px-4">
        <span className="w-12 text-[10px] uppercase tracking-wider text-neutral-500">Rekam</span>
        <input
          type="range"
          min={0}
          max={LIVE_POS}
          step={1}
          value={position}
          onChange={handleChange}
          aria-label="Timeline rekaman"
          className="h-1 flex-1 cursor-pointer accent-blue-500"
        />
        <span className="w-12 text-right text-xs tabular-nums text-neutral-300">{stamp}</span>
        <button
          type="button"
          onClick={() => setPosition(LIVE_POS)}
          disabled={position === LIVE_POS}
          className="h-8 border border-neutral-500 bg-transparent px-3 text-[11px] font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
        >
          [ LIVE ]
        </button>
      </div>
    </div>
  );
}