import { useEffect, useRef } from 'react';
import type { UIEvent } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@core/stores/gameStore';
import { cx } from '@core/utils/cx';

interface LogRow {
  time: string;
  account: string;
  action: string;
  location: string;
}

const MAX_ANOMALY_ROWS = 11;
const BOTTOM_THRESHOLD_PX = 8;
const COOLDOWN_MS = 700;

const ANOMALY_ROW: LogRow = {
  time: '03:00:00',
  account: 'bagas.p',
  action: 'login',
  location: 'L4-PC-01',
};

const ROW_GRID = 'grid grid-cols-[100px_1fr_100px_1fr] items-center gap-2 px-4';

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

export function LogApp() {
  const playerName = useGameStore((s) => s.playerName);
  const scrollCount = useGameStore((s) => s.flags.act2.e02ScrollCount);
  const setFlag = useGameStore((s) => s.setFlag);
  const lastTopRef = useRef<number>(0);
  const lastAddRef = useRef<number>(0);
  const countRef = useRef<number>(scrollCount);
  countRef.current = scrollCount;

  useEffect(() => {
    if (useGameStore.getState().flags.act2.e02LogOpened) return;
    setFlag('act2.e02LogOpened', true);
  }, [setFlag]);

  const normalRows = buildNormalRows(playerName);
  const anomalyRows = Array.from({ length: scrollCount }, () => ANOMALY_ROW);

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

  return (
    <div className="flex h-full w-full flex-col bg-[var(--os-bg)] text-neutral-100">
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
            </tbody>
          </table>
        </div>
      </div>

      <footer className="flex h-7 shrink-0 items-center border-t border-[var(--os-border)] bg-[var(--os-panel)] px-3 text-[11px] text-neutral-500">
        {normalRows.length + anomalyRows.length} entri
      </footer>
    </div>
  );
}