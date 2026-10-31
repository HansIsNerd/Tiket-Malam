import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Battery,
  Bluetooth,
  Moon,
  Plane,
  Sun,
  Volume2,
  Wifi,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { useAppBadges, useBadgeAcknowledge } from '@core/hooks/useAppBadges';
import { cx } from '@core/utils/cx';
import { getAppMeta } from '@windows/appRegistry';
import { NotificationBadge } from '@windows/NotificationBadge';
import { StartMenu } from '@windows/StartMenu';

const FAKE_TODAY = new Date(2025, 10, 2);
const FAKE_DATE = '02/11/2025';
const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const;
const POPUP_CLASS =
  'absolute bottom-14 right-2 z-[9995] w-80 rounded-xl border border-white/10 bg-[#1A1A1D]/90 p-4 shadow-2xl backdrop-blur-xl';
const POPUP_MOTION = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 16 },
  transition: { duration: 0.18, ease: 'easeOut' },
} as const;

function WindowsLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" className="fill-sky-400">
      <rect x="0" y="0" width="8.5" height="8.5" />
      <rect x="9.5" y="0" width="8.5" height="8.5" />
      <rect x="0" y="9.5" width="8.5" height="8.5" />
      <rect x="9.5" y="9.5" width="8.5" height="8.5" />
    </svg>
  );
}

interface ToggleTileProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onToggle: () => void;
}

function ToggleTile({ icon: Icon, label, active, onToggle }: ToggleTileProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cx(
        'flex h-16 flex-col items-center justify-center gap-1.5 rounded-lg border text-[11px] transition-colors',
        active
          ? 'border-blue-500/60 bg-blue-500 text-white'
          : 'border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10',
      )}
    >
      <Icon size={18} strokeWidth={1.75} />
      <span>{label}</span>
    </button>
  );
}

function QuickSettingsPopup() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    wifi: true,
    bluetooth: false,
    airplane: false,
    night: false,
  });
  const [volume, setVolume] = useState<number>(60);
  const [brightness, setBrightness] = useState<number>(80);

  const flip = (key: string) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <motion.div {...POPUP_MOTION} className={POPUP_CLASS}>
      <div className="grid grid-cols-3 grid-rows-2 gap-2">
        <ToggleTile icon={Wifi} label="Wi-Fi" active={toggles.wifi} onToggle={() => flip('wifi')} />
        <ToggleTile
          icon={Bluetooth}
          label="Bluetooth"
          active={toggles.bluetooth}
          onToggle={() => flip('bluetooth')}
        />
        <ToggleTile
          icon={Plane}
          label="Airplane"
          active={toggles.airplane}
          onToggle={() => flip('airplane')}
        />
        <ToggleTile
          icon={Moon}
          label="Night Light"
          active={toggles.night}
          onToggle={() => flip('night')}
        />
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <label className="flex items-center gap-3 text-neutral-300">
          <Volume2 size={16} strokeWidth={1.75} className="shrink-0" />
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            className="h-1 w-full cursor-pointer accent-blue-500"
          />
        </label>
        <label className="flex items-center gap-3 text-neutral-300">
          <Sun size={16} strokeWidth={1.75} className="shrink-0" />
          <input
            type="range"
            min={0}
            max={100}
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            aria-label="Brightness"
            className="h-1 w-full cursor-pointer accent-blue-500"
          />
        </label>
      </div>
    </motion.div>
  );
}

function buildCalendarCells(today: Date): Array<number | null> {
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<number | null> = Array.from({ length: firstDay }, () => null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  return cells;
}

function CalendarPopup() {
  const today = FAKE_TODAY;
  const cells = buildCalendarCells(today);
  const dateLabel = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <motion.div {...POPUP_MOTION} className={POPUP_CLASS}>
      <p className="mb-3 text-sm font-semibold text-neutral-100">{dateLabel}</p>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
        {DAY_NAMES.map((d) => (
          <span key={d} className="py-1 text-neutral-500">
            {d}
          </span>
        ))}
        {cells.map((day, i) => (
          <span
            key={`${i}-${day ?? 'x'}`}
            className={cx(
              'flex h-8 items-center justify-center rounded-full tabular-nums',
              day === null && 'invisible',
              day === today.getDate()
                ? 'bg-blue-500 font-semibold text-white'
                : 'text-neutral-300',
            )}
          >
            {day ?? ''}
          </span>
        ))}
      </div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <h3 className="mb-1 text-[10px] uppercase tracking-wider text-neutral-500">Notifikasi</h3>
        <p className="text-xs text-neutral-400">Tidak ada notifikasi baru</p>
      </div>
    </motion.div>
  );
}

export function Taskbar() {
  const timeCurrent = useGameStore((s) => s.timeCurrent);
  const windows = useUiStore((s) => s.windows);
  const focusWindow = useUiStore((s) => s.focusWindow);
  const minimizeWindow = useUiStore((s) => s.minimizeWindow);
  const restoreWindow = useUiStore((s) => s.restoreWindow);
  const activeTrayMenu = useUiStore((s) => s.activeTrayMenu);
  const setTrayMenu = useUiStore((s) => s.setTrayMenu);
  const isStartMenuOpen = useUiStore((s) => s.isStartMenuOpen);
  const toggleStartMenu = useUiStore((s) => s.toggleStartMenu);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const badges = useAppBadges();
  useBadgeAcknowledge();

  const handleAppClick = (id: string, isFocused: boolean, isMinimized: boolean) => {
    if (isMinimized) {
      restoreWindow(id);
    } else if (isFocused) {
      minimizeWindow(id);
    } else {
      focusWindow(id);
    }
  };

  return (
    <>
      <StartMenu />

      {activeTrayMenu !== null ? (
        <div
          aria-hidden="true"
          onClick={() => setTrayMenu(null)}
          className="fixed inset-0 z-[9990]"
        />
      ) : null}

      <AnimatePresence mode="wait">
        {activeTrayMenu === 'quick_settings' ? <QuickSettingsPopup key="qs" /> : null}
        {activeTrayMenu === 'calendar' ? <CalendarPopup key="cal" /> : null}
      </AnimatePresence>

      <footer className="absolute inset-x-0 bottom-0 z-[9999] grid h-12 grid-cols-[1fr_auto_1fr] items-center border-t border-white/10 bg-[#1A1A1D]/80 px-2 backdrop-blur-lg">
        <div className="flex items-center justify-start">
          <button
            type="button"
            aria-label="Start"
            aria-expanded={isStartMenuOpen}
            onClick={toggleStartMenu}
            className={cx(
              'flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-white/10',
              isStartMenuOpen && 'bg-white/10',
            )}
          >
            <WindowsLogo />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1">
          {windows
            .filter((win) => !win.isHidden)
            .map((win) => {
              const Icon = getAppMeta(win.appId)?.icon;
              const isFocused = win.isFocused && !win.isMinimized;
              return (
                <div key={win.id} className="relative">
                  <AnimatePresence>
                    {hoveredId === win.id ? (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.12, ease: 'easeOut' }}
                        className="pointer-events-none absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-[#2A2A2E] px-2 py-1 text-xs text-neutral-100 shadow-lg"
                      >
                        {win.title}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                  <motion.button
                    type="button"
                    aria-label={win.title}
                    onClick={() => handleAppClick(win.id, win.isFocused, win.isMinimized)}
                    onMouseEnter={() => setHoveredId(win.id)}
                    onMouseLeave={() => setHoveredId((prev) => (prev === win.id ? null : prev))}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className={cx(
                      'relative flex h-10 w-10 items-center justify-center rounded-md text-neutral-100 transition-colors hover:bg-white/10',
                      isFocused && 'bg-white/10',
                    )}
                  >
                    {Icon ? <Icon size={20} strokeWidth={1.5} /> : null}
                    <NotificationBadge count={badges[win.appId] ?? 0} />
                    <span
                      className={cx(
                        'absolute bottom-[3px] h-[3px] rounded-full transition-all duration-200',
                        isFocused ? 'w-4 bg-blue-500' : 'w-2 bg-gray-400',
                      )}
                    />
                  </motion.button>
                </div>
              );
            })}
        </div>

        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label="Quick settings"
            aria-expanded={activeTrayMenu === 'quick_settings'}
            onClick={() => setTrayMenu('quick_settings')}
            className={cx(
              'flex h-9 items-center gap-2 rounded-md px-2 text-neutral-300 transition-colors hover:bg-white/10',
              activeTrayMenu === 'quick_settings' && 'bg-white/10',
            )}
          >
            <Wifi size={14} strokeWidth={1.75} />
            <Volume2 size={14} strokeWidth={1.75} />
            <Battery size={14} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Kalender"
            aria-expanded={activeTrayMenu === 'calendar'}
            onClick={() => setTrayMenu('calendar')}
            className={cx(
              'flex h-9 flex-col items-end justify-center rounded-md px-2 leading-tight text-neutral-200 transition-colors hover:bg-white/10',
              activeTrayMenu === 'calendar' && 'bg-white/10',
            )}
          >
            <span className="text-xs tabular-nums">{timeCurrent}</span>
            <span className="text-[10px] tabular-nums text-neutral-400">{FAKE_DATE}</span>
          </button>
        </div>
      </footer>
    </>
  );
}