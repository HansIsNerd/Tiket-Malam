import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Command, Folder, MessageCircle, StickyNote, Terminal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { cx } from '@core/utils/cx';
import { ForceQuitDialog } from '@macos/ForceQuitDialog';

const WALLPAPER_URL =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1920';

const MENU_BAR_HEIGHT = 28;
const IDLE_HINT_MS = 120000;
const MAC_NOTIF_AUTO_DISMISS_MS = 9000;
const HINT_SENDER = '?';
const HINT_MESSAGE = 'Dia tidak akan mati dengan satu klik.';
const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const;
const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const;
const FAKE_TODAY = new Date(2025, 10, 2);

interface DockApp {
  appId: string;
  title: string;
  icon: LucideIcon;
  tileClass: string;
}

interface MacNotification {
  id: string;
  sender: string;
  message: string;
}

const DOCK_APPS: readonly DockApp[] = [
  {
    appId: 'finder',
    title: 'Finder',
    icon: Folder,
    tileClass: 'bg-gradient-to-b from-[#5AB4F5] to-[#1F72D8]',
  },
  {
    appId: 'notes',
    title: 'Notes',
    icon: StickyNote,
    tileClass: 'bg-gradient-to-b from-[#FFE066] to-[#F2B90C]',
  },
  {
    appId: 'terminal',
    title: 'Terminal',
    icon: Terminal,
    tileClass: 'bg-gradient-to-b from-[#3A3A3C] to-[#0B0B0C]',
  },
  {
    appId: 'messages',
    title: 'Messages',
    icon: MessageCircle,
    tileClass: 'bg-gradient-to-b from-[#6EE07F] to-[#1FAF3E]',
  },
];

const MAC_WINDOW_SIZES: Record<string, { width: number; height: number }> = {
  finder: { width: 720, height: 460 },
  notes: { width: 560, height: 420 },
  terminal: { width: 640, height: 400 },
  messages: { width: 720, height: 460 },
};

function formatMacClock(time: string): string {
  const day = DAY_NAMES[FAKE_TODAY.getDay()];
  const month = MONTH_NAMES[FAKE_TODAY.getMonth()];
  return `${day} ${FAKE_TODAY.getDate()} ${month}  ${time.replace(':', '.')}`;
}

interface MacNotificationCardProps {
  notification: MacNotification;
  onDismiss: () => void;
}

function MacNotificationCard({ notification, onDismiss }: MacNotificationCardProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, MAC_NOTIF_AUTO_DISMISS_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [onDismiss]);

  return (
    <motion.div
      role="status"
      onClick={onDismiss}
      initial={{ opacity: 0, x: 48 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 48 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute right-3 z-[9600] flex w-80 cursor-default items-start gap-3 rounded-2xl border border-black/10 bg-white/85 p-3 text-neutral-800 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      style={{ top: MENU_BAR_HEIGHT + 8 }}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-b from-[#6EE07F] to-[#1FAF3E]">
        <MessageCircle size={20} strokeWidth={1.75} className="text-white" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-[13px] font-semibold">{notification.sender}</span>
          <span className="shrink-0 text-[11px] text-neutral-500">sekarang</span>
        </div>
        <span className="break-words text-[13px] leading-snug text-neutral-700">
          {notification.message}
        </span>
      </div>
    </motion.div>
  );
}

export function MacDesktop() {
  const timeCurrent = useGameStore((s) => s.timeCurrent);
  const triedForceQuit03 = useGameStore((s) => s.flags.mac.triedForceQuit03);
  const macWindows = useUiStore((s) => s.macWindows);
  const openMacWindow = useUiStore((s) => s.openMacWindow);
  const [appleMenuOpen, setAppleMenuOpen] = useState<boolean>(false);
  const [forceQuitOpen, setForceQuitOpen] = useState<boolean>(false);
  const [engaged, setEngaged] = useState<boolean>(false);
  const [notification, setNotification] = useState<MacNotification | null>(null);

  const terminalOpen = macWindows.some((w) => w.appId === 'terminal');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const cmd = e.metaKey || e.ctrlKey;
      if (cmd && e.altKey && e.key === 'Escape') {
        e.preventDefault();
        setAppleMenuOpen(false);
        setForceQuitOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // >>> START PATCH
  useEffect(() => {
    if (engaged) return;
    if (terminalOpen || forceQuitOpen || triedForceQuit03) setEngaged(true);
  }, [engaged, terminalOpen, forceQuitOpen, triedForceQuit03]);

  useEffect(() => {
    if (engaged) return;
    const timer = window.setTimeout(() => {
      setNotification({ id: 'hint_force_quit', sender: HINT_SENDER, message: HINT_MESSAGE });
    }, IDLE_HINT_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [engaged]);

  const dismissNotification = () => setNotification(null);
  // <<< END PATCH

  const openForceQuit = () => {
    setAppleMenuOpen(false);
    setForceQuitOpen(true);
  };

  return (
    <div className="absolute inset-0">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${WALLPAPER_URL})` }}
      />

      <header
        className="absolute inset-x-0 top-0 z-[9001] flex items-center justify-between bg-black/25 px-4 text-[13px] text-white backdrop-blur-xl"
        style={{ height: MENU_BAR_HEIGHT }}
      >
        <div className="flex items-center gap-5">
          <button
            type="button"
            aria-label="Apple"
            aria-expanded={appleMenuOpen}
            onClick={() => setAppleMenuOpen((v) => !v)}
            className={cx(
              'flex h-5 w-6 items-center justify-center rounded transition-colors hover:bg-white/20',
              appleMenuOpen && 'bg-white/20',
            )}
          >
            <Command size={14} strokeWidth={2} />
          </button>
          <span className="font-semibold">Finder</span>
        </div>
        <span className="tabular-nums">{formatMacClock(timeCurrent)}</span>
      </header>

      {appleMenuOpen ? (
        <>
          <div
            aria-hidden="true"
            onClick={() => setAppleMenuOpen(false)}
            className="fixed inset-0 z-[9000]"
          />
          <ul
            role="menu"
            className="absolute left-3 z-[9002] w-56 rounded-md border border-white/20 bg-neutral-800/90 py-1 text-[13px] text-white shadow-2xl backdrop-blur-xl"
            style={{ top: MENU_BAR_HEIGHT }}
          >
            <li>
              <button
                type="button"
                role="menuitem"
                onClick={openForceQuit}
                className="flex w-full items-center justify-between px-3 py-1 text-left hover:bg-[#1F72D8]"
              >
                <span>Force Quit...</span>
                <span className="text-[11px] text-white/60">⌥⌘⎋</span>
              </button>
            </li>
          </ul>
        </>
      ) : null}

      <nav
        aria-label="Dock"
        className="absolute inset-x-0 bottom-2 z-[9000] flex justify-center"
      >
        <ul className="flex items-end gap-2 rounded-2xl border border-white/20 bg-white/20 px-2.5 py-2 shadow-2xl backdrop-blur-2xl">
          {DOCK_APPS.map(({ appId, title, icon: Icon, tileClass }) => {
            const isOpen = macWindows.some((w) => w.appId === appId);
            return (
              <li key={appId} className="relative flex flex-col items-center">
                <motion.button
                  type="button"
                  aria-label={title}
                  title={title}
                  onClick={() => openMacWindow({ appId, title, size: MAC_WINDOW_SIZES[appId] })}
                  whileHover={{ scale: 1.25, y: -6 }}
                  whileTap={{ scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className={cx(
                    'flex h-12 w-12 items-center justify-center rounded-[14px] shadow-lg shadow-black/40 ring-1 ring-white/20',
                    tileClass,
                  )}
                >
                  <Icon size={26} strokeWidth={1.75} className="text-white" />
                </motion.button>
                <span
                  className={cx(
                    'absolute -bottom-1.5 h-1 w-1 rounded-full bg-white/80',
                    !isOpen && 'invisible',
                  )}
                />
              </li>
            );
          })}
        </ul>
      </nav>

      <AnimatePresence>
        {notification !== null ? (
          <MacNotificationCard
            key={notification.id}
            notification={notification}
            onDismiss={dismissNotification}
          />
        ) : null}
      </AnimatePresence>

      {forceQuitOpen ? <ForceQuitDialog onClose={() => setForceQuitOpen(false)} /> : null}
    </div>
  );
}