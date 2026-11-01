import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { cx } from '@core/utils/cx';

const HIDE_03_MS = 1000;
const PLAYER_ROW_THRESHOLD = 5;
const PROCESS_03_ID = 'proc_03';
const PLAYER_ROW_ID = 'proc_player';

interface ForceQuitRow {
  id: string;
  label: string;
  notResponding: boolean;
  windowAppId?: string;
}

interface ForceQuitDialogProps {
  onClose: () => void;
}

export function ForceQuitDialog({ onClose }: ForceQuitDialogProps) {
  const playerName = useGameStore((s) => s.playerName);
  const forceQuitCount = useGameStore((s) => s.flags.mac.forceQuitCount);
  const closeMacWindow = useUiStore((s) => s.closeMacWindow);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hidden03, setHidden03] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (forceQuitCount < PLAYER_ROW_THRESHOLD) return;
    const { flags, setFlag } = useGameStore.getState();
    if (!flags.mac.playerInForceQuit) setFlag('mac.playerInForceQuit', true);
  }, [forceQuitCount]);

  const rows: ForceQuitRow[] = [
    { id: 'app_finder', label: 'Finder', notResponding: false, windowAppId: 'finder' },
    { id: 'app_notes', label: 'Notes', notResponding: false, windowAppId: 'notes' },
    { id: 'app_terminal', label: 'Terminal', notResponding: false, windowAppId: 'terminal' },
    { id: 'app_messages', label: 'Messages', notResponding: false, windowAppId: 'messages' },
  ];
  if (!hidden03) {
    rows.push({ id: PROCESS_03_ID, label: '03:00', notResponding: true });
  }
  if (forceQuitCount >= PLAYER_ROW_THRESHOLD) {
    rows.push({ id: PLAYER_ROW_ID, label: playerName, notResponding: false });
  }

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const handleForceQuit = () => {
    if (selected === null) return;

    if (selected.id === PROCESS_03_ID) {
      const { setFlag, flags } = useGameStore.getState();
      setFlag('mac.triedForceQuit03', true);
      setFlag('mac.forceQuitCount', flags.mac.forceQuitCount + 1);
      setHidden03(true);
      setSelectedId(null);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        setHidden03(false);
        timerRef.current = null;
      }, HIDE_03_MS);
      return;
    }

    if (selected.windowAppId !== undefined) {
      closeMacWindow(selected.windowAppId);
      setSelectedId(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Force Quit Applications"
      onClick={onClose}
      className="absolute inset-0 z-[9500] flex items-center justify-center bg-black/20"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-[380px] flex-col gap-3 rounded-[12px] border border-black/20 bg-[#ECECEE] p-4 text-neutral-800 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[14px] font-semibold">Force Quit Applications</h2>
            <p className="text-[12px] text-neutral-500">
              If an app doesn't respond, select its name and click Force Quit.
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-neutral-500 hover:bg-black/10"
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>

        <ul className="h-44 overflow-y-auto rounded-md border border-black/15 bg-white">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => setSelectedId(row.id)}
                className={cx(
                  'flex w-full items-center gap-1 px-3 py-1.5 text-left text-[13px]',
                  selectedId === row.id ? 'bg-[#1F72D8] text-white' : 'hover:bg-black/5',
                )}
              >
                <span className="truncate">{row.label}</span>
                {row.notResponding ? (
                  <span
                    className={cx(
                      'shrink-0',
                      selectedId === row.id ? 'text-white/80' : 'text-red-600',
                    )}
                  >
                    (Not responding)
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={selected === null}
            onClick={handleForceQuit}
            className="h-7 rounded-md border border-black/20 bg-white px-4 text-[13px] font-medium transition-colors hover:bg-neutral-100 disabled:opacity-40 disabled:hover:bg-white"
          >
            Force Quit
          </button>
        </div>
      </div>
    </div>
  );
}