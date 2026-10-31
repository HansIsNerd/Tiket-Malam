import { useEffect, useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Power, Search } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { APPS } from '@windows/appRegistry';

const WINDOW_SIZES: Record<string, { width: number; height: number }> = {
  chat: { width: 900, height: 500 },
  ticket: { width: 800, height: 500 },
  mail: { width: 1000, height: 500 },
  directory: { width: 820, height: 480 },
  remote: { width: 860, height: 520 },
  log: { width: 760, height: 440 },
};

const TOAST_MS = 3500;
const QUIT_MESSAGE = 'Sistem menolak perintah. Shift belum selesai.';
const BTN =
  'h-9 border border-neutral-500 bg-transparent px-5 text-xs font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10';

const PANEL_STYLE: CSSProperties = {
  position: 'absolute',
  left: 8,
  bottom: 64,
  width: 500,
  height: 550,
  maxWidth: 'calc(100% - 16px)',
  maxHeight: 'calc(100% - 80px)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: 'rgba(26, 26, 29, 0.97)',
  backdropFilter: 'blur(40px)',
  WebkitBackdropFilter: 'blur(40px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 12,
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
  zIndex: 9996,
};

const GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gridAutoRows: 96,
  gap: 8,
  margin: 0,
  padding: 0,
  listStyle: 'none',
};

export function StartMenu() {
  const isOpen = useUiStore((s) => s.isStartMenuOpen);
  const openWindow = useUiStore((s) => s.openWindow);
  const playerName = useGameStore((s) => s.playerName);
  const setFlag = useGameStore((s) => s.setFlag);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast === null) return;
    const timer = window.setTimeout(() => setToast(null), TOAST_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [toast]);

  useEffect(() => {
    if (!isOpen) setSearchQuery('');
  }, [isOpen]);

  const closeMenu = () => useUiStore.setState({ isStartMenuOpen: false });

  const query = searchQuery.trim().toLowerCase();
  const apps = APPS.filter((a) => a.title.toLowerCase().includes(query));
  const initial = (playerName.trim().charAt(0) || '?').toUpperCase();

  const handleLaunch = (appId: string, title: string) => {
    openWindow({ appId, title, size: WINDOW_SIZES[appId] });
    closeMenu();
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const first = apps[0];
    if (first) handleLaunch(first.appId, first.title);
  };

  const handleConfirmQuit = () => {
    setFlag('act1.playerTriedToQuit', true);
    setConfirmOpen(false);
    closeMenu();
    setToast(QUIT_MESSAGE);
  };

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <>
            <div
              aria-hidden="true"
              onClick={closeMenu}
              style={{ position: 'fixed', inset: 0, zIndex: 9991 }}
            />
            <motion.div
              key="start-menu"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              style={PANEL_STYLE}
            >
              <form
                onSubmit={handleSearchSubmit}
                style={{ flexShrink: 0, padding: '20px 20px 12px' }}
              >
                <label className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-neutral-300 focus-within:border-blue-500/60">
                  <Search size={16} strokeWidth={1.75} className="shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari aplikasi"
                    autoFocus
                    aria-label="Cari aplikasi"
                    className="min-w-0 flex-1 bg-transparent text-sm text-neutral-100 outline-none placeholder:text-neutral-500"
                  />
                </label>
              </form>

              <div
                className="chat-scroll"
                style={{
                  flex: '1 1 0%',
                  minHeight: 0,
                  overflowY: 'auto',
                  padding: '8px 20px 20px',
                }}
              >
                <h3
                  className="text-xs font-semibold text-neutral-300"
                  style={{ margin: '0 0 12px' }}
                >
                  Pinned
                </h3>
                {apps.length === 0 ? (
                  <p className="p-6 text-center text-sm text-neutral-500">
                    Tidak ada aplikasi ditemukan
                  </p>
                ) : (
                  <ul style={GRID_STYLE}>
                    {apps.map(({ appId, title, icon: Icon, tileClass }) => (
                      <li key={appId} style={{ minWidth: 0 }}>
                        <button
                          type="button"
                          onClick={() => handleLaunch(appId, title)}
                          className="flex w-full flex-col items-center justify-center rounded-lg text-[11px] text-neutral-100 transition-colors hover:bg-white/10"
                          style={{ height: '100%', gap: 8 }}
                        >
                          <span
                            className={`flex items-center justify-center rounded-xl shadow-lg shadow-black/50 ring-1 ring-white/10 ${tileClass}`}
                            style={{ width: 44, height: 44 }}
                          >
                            <Icon size={22} strokeWidth={2} className="text-white" />
                          </span>
                          <span>{title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <footer
                className="flex items-center justify-between border-t border-white/10 bg-black/20"
                style={{ height: 56, flexShrink: 0, padding: '0 20px' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex items-center justify-center rounded-full bg-neutral-500 text-sm font-medium text-white"
                    style={{ width: 32, height: 32 }}
                  >
                    {initial}
                  </span>
                  <span className="text-xs text-neutral-200">{playerName}</span>
                </div>
                <button
                  type="button"
                  aria-label="Keluar"
                  onClick={() => setConfirmOpen(true)}
                  className="flex items-center justify-center rounded-md text-neutral-200 transition-colors hover:bg-white/10"
                  style={{ width: 36, height: 36 }}
                >
                  <Power size={16} strokeWidth={1.75} />
                </button>
              </footer>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      {confirmOpen ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label="Konfirmasi keluar"
          className="flex items-center justify-center bg-black/60"
          style={{ position: 'absolute', inset: 0, zIndex: 10000 }}
        >
          <div
            className="flex flex-col gap-5 border border-neutral-500 bg-[var(--os-panel)] p-5 text-xs text-neutral-200 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
            style={{ width: 320 }}
          >
            <p className="leading-relaxed">
              Apakah Anda yakin ingin keluar dari sistem? Shift belum selesai.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => setConfirmOpen(false)}
                className={BTN}
              >
                [ Batal ]
              </button>
              <button type="button" onClick={handleConfirmQuit} className={BTN}>
                [ Keluar ]
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {toast !== null ? (
          <motion.div
            key="quit-toast"
            role="status"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="rounded-lg border border-white/10 bg-[#2A2A2E] px-4 py-3 text-xs text-neutral-100 shadow-2xl"
            style={{ position: 'absolute', bottom: 64, right: 16, width: 288, zIndex: 10001 }}
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}