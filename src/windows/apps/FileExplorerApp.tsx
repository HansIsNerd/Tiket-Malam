import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileText, X } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import type { FileItem } from '@core/types/files';
import { cx } from '@core/utils/cx';

const JANGAN_BUKA_NAME = 'jangan_buka.txt';
const JANGAN_BUKA_DELAY_MS = 3000;

export function FileExplorerApp() {
  const fileData = useGameStore((s) => s.fileData);
  const playerName = useGameStore((s) => s.playerName);
  const setFlag = useGameStore((s) => s.setFlag);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const files: FileItem[] = useMemo(
    () => (fileData?.files ?? []).filter((f) => (f.location ?? 'desktop') === 'desktop'),
    [fileData],
  );
  const openFile = files.find((f) => f.id === openId) ?? null;
  const openFileName = openFile?.name ?? null;

  useEffect(() => {
    if (openFileName !== JANGAN_BUKA_NAME) return;
    const timer = window.setTimeout(() => {
      setFlag('act1.janganBukaReadEnough', true);
    }, JANGAN_BUKA_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [openFileName, setFlag]);

  const closeViewer = () => setOpenId(null);

  return (
    <div className="relative flex h-full w-full flex-col bg-[var(--os-bg)] text-neutral-100">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[var(--os-border)] bg-[var(--os-panel)] px-3">
        <ArrowLeft size={16} strokeWidth={1.75} className="shrink-0 text-neutral-500" />
        <div className="flex min-w-0 flex-1 items-center border border-[var(--os-border)] bg-[var(--os-bg)] px-3 py-1 text-xs text-neutral-300">
          <span className="truncate">{`C:\\Users\\${playerName}\\Desktop`}</span>
        </div>
      </div>

      <div className="chat-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {files.length === 0 ? (
          <p className="p-6 text-center text-sm text-neutral-500">Folder ini kosong</p>
        ) : (
          <ul className="grid grid-cols-[repeat(auto-fill,6rem)] gap-2">
            {files.map((file) => (
              <li key={file.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(file.id)}
                  onDoubleClick={() => setOpenId(file.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setOpenId(file.id);
                  }}
                  title={file.name}
                  className={cx(
                    'flex h-24 w-24 flex-col items-center gap-2 rounded-md px-1 py-2 text-[11px] text-neutral-200 transition-colors hover:bg-white/10',
                    selectedId === file.id && 'bg-white/10 ring-1 ring-[var(--os-accent)]',
                  )}
                >
                  <FileText size={36} strokeWidth={1.5} className="shrink-0 text-neutral-300" />
                  <span className="w-full break-all text-center leading-tight">{file.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="flex h-7 shrink-0 items-center border-t border-[var(--os-border)] bg-[var(--os-panel)] px-3 text-[11px] text-neutral-500">
        {files.length} item
      </footer>

      {openFile !== null ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={openFile.name}
          className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 p-6"
        >
          <div className="flex max-h-full w-full max-w-md flex-col border border-neutral-500 bg-[var(--os-panel)] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--os-border)] pl-3 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <FileText size={14} strokeWidth={1.5} className="shrink-0" />
                <span className="truncate">{openFile.name}</span>
              </span>
              <button
                type="button"
                aria-label="Tutup"
                autoFocus
                onClick={closeViewer}
                className="flex h-9 w-10 items-center justify-center transition-colors hover:bg-[#E81123] hover:text-white"
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
            <div className="chat-scroll min-h-0 flex-1 overflow-y-auto bg-[var(--os-bg)] p-4">
              <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-neutral-200">
                {openFile.content}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}