import { useCallback, useEffect, useRef, useState } from 'react';
import { FileSpreadsheet, FileText, Folder, Loader2, Lock, Server, X } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { useMinigameStore } from '@core/stores/minigameStore';
import { useNotificationStore } from '@core/stores/notificationStore';
import { useUiStore } from '@core/stores/uiStore';
import { cx } from '@core/utils/cx';
import { RemoteWebcam } from '@windows/apps/RemoteWebcam';
import { ServerPatchGame } from '@windows/apps/ServerPatchGame';

const REMOTE_HOST = 'L4-PC-01';
const CONNECT_DELAY_MS = 3000;
const READ_DELAY_MS = 3000;
const JANGAN_BUKA_NAME = 'jangan_buka.txt';
const JANGAN_BUKA_TEXT = 'kamu telat 11 bulan. — bagas.p';
const LOG_NAME = 'log_akses.csv';
const SERVER_RACK_NAME = 'server_rack.exe';
const BAGAS_WARNING = 'Kamu menyambungkannya ke pintu yang salah.';
const TICKET_GAME_TITLE = 'Patching';
const TICKET_GAME_SUCCESS = 'HDMI Connected. Signal Restored.';

type Phase = 'connecting' | 'connected';

export function RemoteApp() {
  const setFlag = useGameStore((s) => s.setFlag);
  const bagasContact = useGameStore((s) => s.flags.act2.e09BagasContact);
  const chairShifted = useGameStore((s) => s.flags.act2.e17WebcamShift);
  const patchRequested = useMinigameStore((s) => s.remotePatchRequested);
  const clearRemotePatch = useMinigameStore((s) => s.clearRemotePatch);
  const ticketLaunchRef = useRef<boolean>(useMinigameStore.getState().remotePatchRequested);
  const [phase, setPhase] = useState<Phase>('connecting');
  const [folderOpen, setFolderOpen] = useState<boolean>(false);
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [deniedNotice, setDeniedNotice] = useState<boolean>(false);
  const [gameOpen, setGameOpen] = useState<boolean>(false);
  const [ticketGameOpen, setTicketGameOpen] = useState<boolean>(
    useMinigameStore.getState().remotePatchRequested,
  );

  const webcamVisible = phase === 'connected' && bagasContact;

  useEffect(() => {
    if (ticketLaunchRef.current) return;
    setFlag('act1.remoteOpened', true);
  }, [setFlag]);

  useEffect(() => {
    if (!patchRequested) return;
    setTicketGameOpen(true);
    clearRemotePatch();
  }, [patchRequested, clearRemotePatch]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase('connected'), CONNECT_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!viewerOpen) return;
    const timer = window.setTimeout(() => {
      setFlag('act1.janganBukaRead', true);
      setFlag('act1.janganBukaReadEnough', true);
    }, READ_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [viewerOpen, setFlag]);

  useEffect(() => {
    if (!webcamVisible) return;
    if (useGameStore.getState().flags.act2.e15WebcamSeen) return;
    setFlag('act2.e15WebcamSeen', true);
  }, [webcamVisible, setFlag]);

  const handlePatchComplete = useCallback(() => {
    const alreadyPatched = useGameStore.getState().flags.act1.serverPatched;
    setGameOpen(false);
    if (alreadyPatched) return;
    useGameStore.getState().setFlag('act1.serverPatched', true);
    useNotificationStore.getState().addNotification({
      title: 'bagas.p',
      message: BAGAS_WARNING,
      appId: 'chat',
    });
  }, []);

  const handleTicketPatchComplete = useCallback(() => {
    useGameStore.getState().setFlag('act1.ticket4469Done', true);
    setTicketGameOpen(false);
    useUiStore.getState().closeWindow('remote');
  }, []);

  const handleTicketPatchClose = useCallback(() => {
    setTicketGameOpen(false);
    useUiStore.getState().closeWindow('remote');
  }, []);

  if (ticketGameOpen) {
    return (
      <div className="relative h-full w-full bg-black">
        <ServerPatchGame
          title={TICKET_GAME_TITLE}
          successMessage={TICKET_GAME_SUCCESS}
          onComplete={handleTicketPatchComplete}
          onClose={handleTicketPatchClose}
        />
      </div>
    );
  }

  if (phase === 'connecting') {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[var(--os-bg)] text-neutral-200">
        <Loader2 size={32} strokeWidth={1.5} className="animate-spin text-neutral-400" />
        <p className="text-sm">{`Connecting to ${REMOTE_HOST}...`}</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col bg-black text-neutral-100">
      <div className="flex min-h-0 flex-1 gap-2 p-3">
        <button
          type="button"
          onClick={() => {
            setFolderOpen(true);
            setDeniedNotice(false);
          }}
          className="flex h-24 w-24 flex-col items-center gap-2 self-start rounded-md px-1 py-2 text-[11px] text-neutral-200 transition-colors hover:bg-white/10"
        >
          <Folder size={36} strokeWidth={1.5} className="shrink-0 text-amber-400" />
          <span>arsip</span>
        </button>
        <button
          type="button"
          onClick={() => setGameOpen(true)}
          title={SERVER_RACK_NAME}
          className="flex h-24 w-24 flex-col items-center gap-2 self-start rounded-md px-1 py-2 text-[11px] text-neutral-200 transition-colors hover:bg-white/10"
        >
          <Server size={36} strokeWidth={1.5} className="shrink-0 text-neutral-300" />
          <span className="w-full break-all text-center leading-tight">{SERVER_RACK_NAME}</span>
        </button>
      </div>

      {webcamVisible ? <RemoteWebcam chairShifted={chairShifted} /> : null}

      <footer className="flex h-6 shrink-0 items-center border-t border-white/10 px-3 text-[10px] text-neutral-500">
        {`Remote: ${REMOTE_HOST}`}
      </footer>

      {folderOpen ? (
        <div className="absolute left-24 top-6 z-10 flex w-[360px] max-w-[90%] flex-col border border-neutral-500 bg-[var(--os-panel)] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
          <div className="flex h-8 shrink-0 items-center justify-between border-b border-[var(--os-border)] pl-3 text-xs">
            <span className="flex items-center gap-2">
              <Folder size={14} strokeWidth={1.5} />
              arsip
            </span>
            <button
              type="button"
              aria-label="Tutup"
              onClick={() => {
                setFolderOpen(false);
                setDeniedNotice(false);
              }}
              className="flex h-8 w-10 items-center justify-center transition-colors hover:bg-[#E81123] hover:text-white"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
          <ul className="flex gap-2 p-3">
            <li>
              <button
                type="button"
                onClick={() => {
                  setViewerOpen(true);
                  setDeniedNotice(false);
                }}
                title={JANGAN_BUKA_NAME}
                className="flex h-24 w-28 flex-col items-center gap-2 rounded-md px-1 py-2 text-[11px] text-neutral-200 transition-colors hover:bg-white/10"
              >
                <FileText size={36} strokeWidth={1.5} className="shrink-0 text-neutral-300" />
                <span className="w-full break-all text-center leading-tight">{JANGAN_BUKA_NAME}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                aria-disabled="true"
                onClick={() => setDeniedNotice(true)}
                title="Akses ditolak"
                className="flex h-24 w-28 cursor-not-allowed flex-col items-center gap-2 rounded-md px-1 py-2 text-[11px] text-neutral-500"
              >
                <span className="relative shrink-0">
                  <FileSpreadsheet size={36} strokeWidth={1.5} className="text-neutral-600" />
                  <Lock
                    size={14}
                    strokeWidth={2}
                    className="absolute -bottom-1 -right-1 rounded-sm bg-[var(--os-panel)] text-neutral-500"
                  />
                </span>
                <span className="w-full break-all text-center leading-tight">{LOG_NAME}</span>
              </button>
            </li>
          </ul>
          {deniedNotice ? (
            <p className="border-t border-[var(--os-border)] px-3 py-2 text-[11px] text-neutral-400">
              {`${LOG_NAME}: Akses ditolak.`}
            </p>
          ) : null}
        </div>
      ) : null}

      {viewerOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={JANGAN_BUKA_NAME}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-6"
        >
          <div className="flex max-h-full w-full max-w-md flex-col border border-neutral-500 bg-[var(--os-panel)] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--os-border)] pl-3 text-xs">
              <span className="flex min-w-0 items-center gap-2">
                <FileText size={14} strokeWidth={1.5} className="shrink-0" />
                <span className="truncate">{JANGAN_BUKA_NAME}</span>
              </span>
              <button
                type="button"
                aria-label="Tutup"
                autoFocus
                onClick={() => setViewerOpen(false)}
                className={cx(
                  'flex h-9 w-10 items-center justify-center transition-colors',
                  'hover:bg-[#E81123] hover:text-white',
                )}
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
            <div className="chat-scroll min-h-0 flex-1 overflow-y-auto bg-[var(--os-bg)] p-4">
              <p className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-neutral-200">
                {JANGAN_BUKA_TEXT}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {gameOpen ? (
        <ServerPatchGame onComplete={handlePatchComplete} onClose={() => setGameOpen(false)} />
      ) : null}
    </div>
  );
}