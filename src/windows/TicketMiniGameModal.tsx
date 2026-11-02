import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { FileText, X } from 'lucide-react';
import type { TicketMinigame } from '@core/types/tickets';
import { cx } from '@core/utils/cx';
import { CodeCompletionGame } from '@windows/apps/CodeCompletionGame';
import { ServerPatchGame } from '@windows/apps/ServerPatchGame';

const MONO_STACK = "'Courier New', Courier, Consolas, monospace";
const MASH_TARGET = 10;
const CORRECT_URL = 'http://intranet.nusadata.local';
const URL_OPTIONS: readonly string[] = [
  'http://intranet.nusadata.lokal',
  'http://intranet.nusadata.local',
  'http://intranet-nusadata.local',
];
const TERMINAL_WORDS: readonly string[] = ['stop', 'restart', 'delete'];
const TERMINAL_CORRECT = 'restart';
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

function TerminalGame({ ticketId, onComplete, onClose }: GameProps) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);
  const doneRef = useRef<boolean>(false);

  const handlePick = (word: string) => {
    if (doneRef.current) return;
    setChosen(word);
    if (word !== TERMINAL_CORRECT) {
      setError(true);
      return;
    }
    setError(false);
    doneRef.current = true;
    onComplete();
  };

  return (
    <Shell title={`terminal — #${ticketId}`} onClose={onClose}>
      <div
        className="flex min-h-[132px] flex-col gap-2 bg-black p-4 text-[13px] leading-relaxed text-neutral-200"
        style={{ fontFamily: MONO_STACK }}
      >
        <p className="break-all">
          {'> sudo systemctl '}
          <span
            className={cx(
              'inline-block border-b px-1',
              chosen === null
                ? 'border-neutral-500 text-neutral-500'
                : error
                  ? 'border-red-500 text-red-400'
                  : 'border-neutral-300 text-white',
            )}
          >
            {`[ ${chosen ?? '____'} ]`}
          </span>
          {' mail-server'}
        </p>
        {error ? (
          <p role="alert" className="font-semibold text-red-500">
            Command gagal. Server tetap timeout.
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--os-border)] bg-[var(--os-panel)] px-4 py-3">
        {TERMINAL_WORDS.map((word) => (
          <button
            key={word}
            type="button"
            onClick={() => handlePick(word)}
            className="rounded-full border border-[var(--os-accent)] bg-transparent px-3 py-1.5 text-xs text-neutral-100 transition-colors hover:bg-[var(--os-accent)]"
          >
            {word}
          </button>
        ))}
      </div>
    </Shell>
  );
}

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

function MashGame({ ticketId, onComplete, onClose }: GameProps) {
  const [count, setCount] = useState<number>(0);
  const doneRef = useRef<boolean>(false);
  const pct = Math.min(100, (count / MASH_TARGET) * 100);

  useEffect(() => {
    if (count < MASH_TARGET || doneRef.current) return;
    doneRef.current = true;
    const timer = window.setTimeout(onComplete, 400);
    return () => {
      window.clearTimeout(timer);
    };
  }, [count, onComplete]);

  return (
    <Shell title={`Printer macet — #${ticketId}`} onClose={onClose}>
      <div className="flex flex-col gap-4 p-4">
        <div className="relative grid h-40 grid-cols-5 gap-1 overflow-hidden border border-[var(--os-border)] bg-black/60 p-2">
          {Array.from({ length: MASH_TARGET }, (_, i) => (
            <div
              key={i}
              className="h-full rounded-sm bg-white/90 transition-all duration-200"
              style={{
                opacity: i < count ? 0 : 0.9,
                transform: i < count ? 'translateY(-24px) rotate(6deg)' : 'rotate(0deg)',
              }}
            />
          ))}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <span>Kertas ditarik</span>
            <span className="tabular-nums">
              {Math.min(count, MASH_TARGET)}/{MASH_TARGET}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden bg-black/60">
            <div className="h-full bg-emerald-500 transition-[width] duration-100" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <button
          type="button"
          disabled={count >= MASH_TARGET}
          onClick={() => setCount((c) => c + 1)}
          className="h-12 bg-red-600 text-sm font-bold tracking-wider text-white transition-colors hover:bg-red-500 active:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Tarik
        </button>
      </div>
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
    case 'mash':
      return <MashGame ticketId={ticketId} onComplete={onComplete} onClose={onClose} />;
    case 'password':
      return <PasswordGame ticketId={ticketId} onComplete={onComplete} onClose={onClose} />;
    case 'code_completion':
      return <CodeCompletionGame onComplete={onComplete} onClose={onClose} />;
    case 'cable':
      return <ServerPatchGame title="Sambung Kabel" onComplete={onComplete} onClose={onClose} />;
  }
}