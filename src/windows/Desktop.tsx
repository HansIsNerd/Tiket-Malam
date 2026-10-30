import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, X } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import type { FileItem } from '@core/types/files';
import { APPS } from '@windows/appRegistry';

const WALLPAPER_URL =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920';

const WINDOW_SIZES: Record<string, { width: number; height: number }> = {
  chat: { width: 900, height: 500 },
  ticket: { width: 800, height: 500 },
  mail: { width: 1000, height: 500 },
  directory: { width: 820, height: 480 },
  remote: { width: 860, height: 520 },
  log: { width: 760, height: 440 },
};

// Ubah ke 2 saat Log hanya boleh muncul di Babak 2.
const LOG_VISIBLE_FROM_ACT = 1;
const ACT_GATED_APPS: Record<string, number> = {
  log: LOG_VISIBLE_FROM_ACT,
};

export function Desktop() {
  const openWindow = useUiStore((s) => s.openWindow);
  const act = useGameStore((s) => s.act);
  const [openFile, setOpenFile] = useState<FileItem | null>(null);

  const visibleApps = APPS.filter((app) => act >= (ACT_GATED_APPS[app.appId] ?? 1));

  return (
    <div
      className="absolute inset-x-0 top-0 bottom-12 bg-cover bg-center"
      style={{ backgroundImage: `url(${WALLPAPER_URL})` }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative grid h-full grid-flow-col grid-rows-[repeat(auto-fill,6rem)] content-start justify-start gap-1 p-3">
        {visibleApps.map(({ appId, title, icon: Icon, tileClass }) => (
          <motion.button
            key={appId}
            type="button"
            onClick={() => openWindow({ appId, title, size: WINDOW_SIZES[appId] })}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="group flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-xl text-[11px] text-white"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-lg shadow-black/60 ring-1 ring-white/10 transition-[filter] duration-200 group-hover:brightness-125 ${tileClass}`}
            >
              <Icon size={24} strokeWidth={2} className="text-white" />
            </div>
            <span className="[text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">{title}</span>
          </motion.button>
        ))}
      </div>

      <span className="pointer-events-none absolute bottom-4 right-4 select-none text-xs text-white opacity-40">
        Nusa Data Solusi — Internal Use Only
      </span>

      {openFile ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={openFile.name}
          onClick={() => setOpenFile(null)}
          className="absolute inset-0 z-[5000] flex items-center justify-center bg-black/40"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[70%] w-[420px] max-w-[90%] flex-col overflow-hidden rounded-lg border border-white/15 bg-[#1E1E22] text-white shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
          >
            <header className="flex h-9 shrink-0 items-center justify-between border-b border-white/10 pl-3 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <FileText size={14} strokeWidth={1.5} className="shrink-0" />
                <span className="truncate">{openFile.name}</span>
              </span>
              <button
                type="button"
                aria-label="Close"
                autoFocus
                onClick={() => setOpenFile(null)}
                className="flex h-9 w-11 items-center justify-center transition-colors hover:bg-[#E81123]"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </header>
            <pre className="chat-scroll min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-relaxed text-white">
              {openFile.content}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}