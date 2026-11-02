import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { FileText, X } from 'lucide-react';
import type { TicketMinigame } from '@core/types/tickets';
import { cx } from '@core/utils/cx';
import { CodeCompletionGame } from '@windows/apps/CodeCompletionGame';
import { NetworkPatchMiniGame } from '@windows/apps/NetworkPatchMiniGame';
import { PrintSpoolerGame } from '@windows/apps/PrintSpoolerGame';

const MONO_STACK = "'Courier New', Courier, Consolas, monospace";
const CORRECT_URL = 'http://intranet.nusadata.local';
const URL_OPTIONS: readonly string[] = [
  'http://intranet.nusadata.lokal',
  'http://intranet.nusadata.local',
  'http://intranet-nusadata.local',
];
// >>> START PATCH
const TERMINAL_DEFAULT_SERVICE = 'mail-server';
const TERMINAL_SERVICES: Record<string, string> = {
  '4461': 'router-lobby',
};
const TERMINAL_LINE_MS = 500;
const TERMINAL_CLOSE_AFTER_SUCCESS_MS = 1200;
const TERMINAL_ERROR_TEXT = 'Command not found.';
// <<< END PATCH
const PASSWORD_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const ACTION_BTN =
  'h-8 border border-neutral-500 bg-transparent px-4 text-xs font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

interface TicketMiniGameModalProps {
  ticketId: string;
  kind: TicketMinigame;
  onComplete: () => void;
  onClose: () => void;
}

interface ShellProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

function Shell({ title, onClose, children }: ShellProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-4"
    >
      <div className="flex max-h-full w-full max-w-lg flex-col overflow-hidden border border-neutral-500 bg-[var(--os-panel)] shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--os-border)] pl-3 text-xs text-neutral-100">
          <span className="flex min-w-0 items-center gap-2">
            <FileText size={14} strokeWidth={1.5} className="shrink-0" />
            <span className="truncate">{title}</span>
          </span>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="flex h-9 w-10 items-center justify-center transition-colors hover:bg-[#E81123] hover:text-white"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface GameProps {
  ticketId: string;
  onComplete: () => void;
  onClose: () => void;
}

// >>> START PATCH
type TerminalPhase = 'input' | 'error' | 'executing' | 'success';

function normalizeCommand(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ').toLowerCase();
}

function TerminalGame({ ticketId, onComplete, onClose }: GameProps) {
  const service = TERMINAL_SERVICES[ticketId] ?? TERMINAL_DEFAULT_SERVICE;
  const correctCommand = `systemctl restart ${service}`;
  const chips: readonly string[] = [correctCommand, 'reboot --now', `ping ${service}`];
  const execLines: readonly string[] = [
    '> executing command...',
    `Stopping ${service}...`,
    'Clearing socket buffers...',
    `Starting ${service}...`,
  ];
  const successLine = `${service.toUpperCase()} RESTORED.`;

  const [value, setValue] = useState<string>('');
  const [phase, setPhase] = useState<TerminalPhase>('input');
  const [execCount, setExecCount] = useState<number>(0);
  const timersRef = useRef<number[]>([]);
  const completedRef = useRef<boolean>(false);
  const completeRef = useRef<() => void>(onComplete);

  completeRef.current = onComplete;

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  const schedule = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  const busy = phase === 'executing' || phase === 'success';

  const runCommand = (raw: string) => {
    if (busy) return;
    if (normalizeCommand(raw) !== correctCommand) {
      setPhase('error');
      return;
    }
    setPhase('executing');
    setExecCount(0);
    execLines.forEach((_, i) => {
      schedule(() => setExecCount(i + 1), TERMINAL_LINE_MS * (i + 1));
    });
    schedule(() => setPhase('success'), TERMINAL_LINE_MS * (execLines.length + 1));
    schedule(
      () => {
        if (completedRef.current) return;
        completedRef.current = true;
        completeRef.current();
      },
      TERMINAL_LINE_MS * (execLines.length + 1) + TERMINAL_CLOSE_AFTER_SUCCESS_MS,
    );
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    runCommand(value);
  };

  const handleChip = (command: string) => {
    if (busy) return;
    setValue(command);
    runCommand(command);
  };

  return (
    <Shell title={`terminal — #${ticketId}`} onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className="flex min-h-[176px] flex-col gap-1.5 bg-black p-4 text-[13px] leading-relaxed text-neutral-200"
        style={{ fontFamily: MONO_STACK }}
      >
        <p className="break-all text-neutral-400">{`# Restart layanan ${service}`}</p>
        <p className="break-words text-[12px] text-neutral-500">
          {`[Hint: Ketik perintah "${correctCommand}" untuk memulai ulang]`}
        </p>
        <label className="flex items-center gap-2">
          <span aria-hidden="true" className="shrink-0 text-neutral-400">
            {'>'}
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (phase === 'error') setPhase('input');
            }}
            disabled={busy}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label="Command"
            className={cx(
              'min-w-0 flex-1 border-0 bg-transparent p-0 text-[13px] caret-neutral-200 outline-none disabled:opacity-70',
              phase === 'error' ? 'text-red-400' : 'text-neutral-100',
            )}
            style={{ fontFamily: MONO_STACK }}
          />
        </label>

        {phase === 'error' ? (
          <p role="alert" className="font-semibold text-red-500">
            {TERMINAL_ERROR_TEXT}
          </p>
        ) : null}

        {busy ? (
          <div role="status" className="flex flex-col gap-1">
            {execLines.slice(0, execCount).map((line, i) =>
              i === 0 ? (
                <p key={line} className="text-neutral-400">
                  {line}
                </p>
              ) : (
                <p key={line} className="break-all">
                  <span className="font-semibold text-emerald-500">{'[ OK ]'}</span>
                  {` ${line}`}
                </p>
              ),
            )}
            {phase === 'success' ? (
              <p className="break-all font-semibold text-emerald-400">
                {`[ SUCCESS ] ${successLine}`}
              </p>
            ) : (
              <span aria-hidden="true" className="end-cursor-blink text-neutral-400">
                _
              </span>
            )}
          </div>
        ) : null}
        <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
      </form>
      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--os-border)] bg-[var(--os-panel)] px-4 py-3">
        {chips.map((command) => (
          <button
            key={command}
            type="button"
            disabled={busy}
            onClick={() => handleChip(command)}
            className="rounded-full border border-[var(--os-accent)] bg-transparent px-3 py-1.5 text-xs text-neutral-100 transition-colors hover:bg-[var(--os-accent)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            style={{ fontFamily: MONO_STACK }}
          >
            {`[ ${command} ]`}
          </button>
        ))}
      </div>
    </Shell>
  );
}
// <<< END PATCH

function DropdownGame({ ticketId, onComplete, onClose }: GameProps) {
  const [value, setValue] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const doneRef = useRef<boolean>(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (doneRef.current || value === '') return;
    if (value !== CORRECT_URL) {
      setError(true);
      return;
    }
    doneRef.current = true;
    onComplete();
  };

  return (
    <Shell title={`Perbaiki URL — #${ticketId}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <p className="text-xs text-neutral-400">Pilih URL intranet yang benar.</p>
        <select
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          className="border border-[var(--os-border)] bg-[var(--os-bg)] px-3 py-2 text-xs text-neutral-100 outline-none focus:border-[var(--os-accent)]"
        >
          <option value="">-- Pilih URL --</option>
          {URL_OPTIONS.map((url) => (
            <option key={url} value={url}>
              {url}
            </option>
          ))}
        </select>
        <p role="alert" className="h-4 text-[11px] text-red-400">
          {error ? 'URL tidak dapat dijangkau.' : ''}
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ACTION_BTN}>
            [ Batal ]
          </button>
          <button type="submit" disabled={value === ''} className={ACTION_BTN}>
            [ Apply ]
          </button>
        </div>
      </form>
    </Shell>
  );
}

function generatePassword(): string {
  return Array.from({ length: 8 }, () =>
    PASSWORD_CHARSET.charAt(Math.floor(Math.random() * PASSWORD_CHARSET.length)),
  ).join('');
}

function PasswordGame({ ticketId, onComplete, onClose }: GameProps) {
  const [target] = useState<string>(generatePassword);
  const [typed, setTyped] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const doneRef = useRef<boolean>(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (doneRef.current) return;
    if (typed !== target) {
      setError(true);
      return;
    }
    doneRef.current = true;
    onComplete();
  };

  return (
    <Shell title={`Reset password — #${ticketId}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <div
          className="flex h-12 items-center justify-center border border-[var(--os-border)] bg-black text-lg tracking-widest text-neutral-100"
          style={{ fontFamily: MONO_STACK }}
          aria-live="polite"
        >
          {target}
        </div>
        <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-neutral-500">
          Ketik ulang password
          <input
            type="text"
            value={typed}
            onChange={(e) => {
              setTyped(e.target.value);
              setError(false);
            }}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="border border-[var(--os-border)] bg-[var(--os-bg)] px-3 py-2 text-sm normal-case tracking-normal text-neutral-100 outline-none focus:border-[var(--os-accent)]"
            style={{ fontFamily: MONO_STACK }}
          />
        </label>
        <p role="alert" className="h-4 text-[11px] text-red-400">
          {error ? 'Password tidak cocok.' : ''}
        </p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ACTION_BTN}>
            [ Batal ]
          </button>
          <button type="submit" disabled={typed === ''} className={ACTION_BTN}>
            [ Apply ]
          </button>
        </div>
      </form>
    </Shell>
  );
}

export function TicketMiniGameModal({ ticketId, kind, onComplete, onClose }: TicketMiniGameModalProps) {
  switch (kind) {
    case 'terminal':
      return <TerminalGame ticketId={ticketId} onComplete={onComplete} onClose={onClose} />;
    case 'dropdown':
      return <DropdownGame ticketId={ticketId} onComplete={onComplete} onClose={onClose} />;
    case 'print_spooler':
      return <PrintSpoolerGame ticketId={ticketId} onComplete={onComplete} onClose={onClose} />;
    case 'password':
      return <PasswordGame ticketId={ticketId} onComplete={onComplete} onClose={onClose} />;
    case 'code_completion':
      return <CodeCompletionGame onComplete={onComplete} onClose={onClose} />;
    case 'cable':
      return <NetworkPatchMiniGame ticketId={ticketId} onComplete={onComplete} onClose={onClose} />;
  }
}