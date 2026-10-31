import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, X } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { useAppBadges } from '@core/hooks/useAppBadges';
import type { FileItem } from '@core/types/files';
import { cx } from '@core/utils/cx';
import { APPS } from '@windows/appRegistry';
import { NotificationBadge } from '@windows/NotificationBadge';

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

const DESKTOP_FILE_ORDER: readonly string[] = ['file_panduan_shift', 'file_catatan_shift'];

const TASK_FILE_ID = 'file_tugas_malam_ini';
const TASK_FILE_NAME = 'Tugas_Malam_Ini.txt';

interface TaskState {
  ticketSeen: boolean;
  remoteOpened: boolean;
  janganBukaRead: boolean;
  logRead: boolean;
}

function resolveTaskLine(s: TaskState): string {
  if (s.logRead) return '1. Tunggu instruksi selanjutnya. Jangan tidur.';
  if (s.janganBukaRead) return '1. Sistem bermasalah. Buka aplikasi Log dan periksa.';
  if (!s.ticketSeen) return '1. Buka aplikasi Ticket. Ada tiket masuk dari bagas.p.';
  if (!s.remoteOpened) return '1. Remote ke PC Lantai 4 (L4).';
  return '1. Periksa isi PC Lantai 4.';
}

export function Desktop() {
  const openWindow = useUiStore((s) => s.openWindow);
  const act = useGameStore((s) => s.act);
  const fileData = useGameStore((s) => s.fileData);
  const ticketSeen = useGameStore((s) => s.flags.act1.ticket4471Seen);
  const remoteOpened = useGameStore((s) => s.flags.act1.remoteOpened);
  const janganBukaRead = useGameStore((s) => s.flags.act1.janganBukaRead);
  const logRead = useGameStore((s) => s.flags.act2.e02LogRead);
  const badges = useAppBadges();
  const [openFileId, setOpenFileId] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const visibleApps = APPS.filter((app) => act >= (ACT_GATED_APPS[app.appId] ?? 1));
  const isDark = act >= 2;

  const taskContent = useMemo(
    () =>
      `TUGAS MALAM INI\n\n${resolveTaskLine({ ticketSeen, remoteOpened, janganBukaRead, logRead })}`,
    [ticketSeen, remoteOpened, janganBukaRead, logRead],
  );

  const desktopFiles: FileItem[] = useMemo(() => {
    const all = fileData?.files ?? [];
    const fromData = DESKTOP_FILE_ORDER.map((id) => all.find((f) => f.id === id)).filter(
      (f): f is FileItem => f !== undefined && (f.location ?? 'desktop') === 'desktop',
    );
    const task: FileItem = {
      id: TASK_FILE_ID,
      name: TASK_FILE_NAME,
      type: 'text',
      location: 'desktop',
      content: taskContent,
    };
    return [task, ...fromData];
  }, [fileData, taskContent]);

  const openFile = desktopFiles.find((f) => f.id === openFileId) ?? null;

  return (
    <div className="absolute inset-x-0 top-0 bottom-12">
      <div
        aria-hidden="true"
        className={cx(
          'absolute inset-0 bg-cover bg-center transition-[filter] duration-1000',
          isDark ? 'brightness-50 grayscale' : 'brightness-100 grayscale-0',
        )}
        style={{ backgroundImage: `url(${WALLPAPER_URL})` }}
      />
      <div
        className={cx(
          'absolute inset-0 transition-colors duration-1000',
          isDark ? 'bg-black/60' : 'bg-black/50',
        )}
      />

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
              className={`relative flex h-12 w-12 items-center justify-center rounded-xl shadow-lg shadow-black/60 ring-1 ring-white/10 transition-[filter] duration-200 group-hover:brightness-125 ${tileClass}`}
            >
              <Icon size={24} strokeWidth={2} className="text-white" />
              <NotificationBadge count={badges[appId] ?? 0} />
            </div>
            <span className="[text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">{title}</span>
          </motion.button>
        ))}

        {desktopFiles.map((file) => (
          <motion.button
            key={file.id}
            type="button"
            title={file.name}
            onClick={() => {
              setSelectedFileId(file.id);
              setOpenFileId(file.id);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cx(
              'flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-xl px-1 text-[11px] text-white transition-colors',
              selectedFileId === file.id && 'bg-white/10 ring-1 ring-white/30',
            )}
          >
            <FileText
              size={40}
              strokeWidth={1.5}
              className="shrink-0 text-neutral-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
            />
            <span className="w-full break-all text-center leading-tight [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
              {file.name}
            </span>
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
          onClick={() => setOpenFileId(null)}
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
                onClick={() => setOpenFileId(null)}
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