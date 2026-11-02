import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { KeyRound, X } from 'lucide-react';

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const SEGMENT_LENGTHS = [2, 3, 2] as const;
const MISMATCH_TEXT = 'Password tidak cocok.';
const MONO_STACK = "'Courier New', Courier, Consolas, monospace";
const ACTION_BTN =
  'h-8 border border-neutral-500 bg-transparent px-4 text-xs font-semibold tracking-wider text-neutral-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

function randomChar(): string {
  return CHARSET.charAt(Math.floor(Math.random() * CHARSET.length));
}

function generatePassword(): string {
  return SEGMENT_LENGTHS.map((len) => Array.from({ length: len }, randomChar).join('')).join('-');
}

interface PasswordResetGameProps {
  onComplete: () => void;
  onClose: () => void;
}

export function PasswordResetGame({ onComplete, onClose }: PasswordResetGameProps) {
  const [generated, setGenerated] = useState<string | null>(null);
  const [typed, setTyped] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const completedRef = useRef<boolean>(false);

  useEffect(() => {
    completedRef.current = false;
  }, []);

  const handleGenerate = () => {
    setGenerated(generatePassword());
    setTyped('');
    setError(false);
  };

  const handleApply = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (generated === null || completedRef.current) return;
    if (typed === generated) {
      completedRef.current = true;
      onComplete();
      return;
    }
    setError(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Password Generator"
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-4"
    >
      <form
        onSubmit={handleApply}
        className="flex w-full max-w-md flex-col border border-neutral-500 bg-[var(--os-panel)] shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
      >
        <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--os-border)] pl-3 text-xs text-neutral-100">
          <span className="flex min-w-0 items-center gap-2">
            <KeyRound size={14} strokeWidth={1.5} className="shrink-0" />
            <span className="truncate">Password Generator</span>
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

        <div className="flex flex-col gap-4 p-4">
          <button type="button" onClick={handleGenerate} className={ACTION_BTN}>
            [ Generate Random Password ]
          </button>

          {/* >>> START PATCH */}
          <div
            className="flex h-12 select-none items-center justify-center border border-[var(--os-border)] bg-black text-lg tracking-widest text-neutral-100"
            style={{
              fontFamily: MONO_STACK,
              userSelect: 'none',
              WebkitUserSelect: 'none',
              WebkitTouchCallout: 'none',
            }}
            aria-live="polite"
            onCopy={(e) => e.preventDefault()}
            onCut={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            onMouseDown={(e) => e.preventDefault()}
          >
            {generated ?? '-- --- --'}
          </div>
          {/* <<< END PATCH */}

          <label className="flex flex-col gap-1 text-[11px] uppercase tracking-wider text-neutral-500">
            Ketik ulang password
            <input
              type="text"
              value={typed}
              onChange={(e) => {
                setTyped(e.target.value);
                setError(false);
              }}
              // >>> START PATCH
              onPaste={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              // <<< END PATCH
              disabled={generated === null}
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              className="border border-[var(--os-border)] bg-[var(--os-bg)] px-3 py-2 text-sm normal-case tracking-normal text-neutral-100 outline-none placeholder:text-neutral-600 focus:border-[var(--os-accent)] disabled:cursor-not-allowed disabled:opacity-40"
              style={{ fontFamily: MONO_STACK }}
            />
          </label>

          <p role="alert" className="h-4 text-[11px] text-red-400">
            {error ? MISMATCH_TEXT : ''}
          </p>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[var(--os-border)] px-4 py-3">
          <button type="button" onClick={onClose} className={ACTION_BTN}>
            [ Batal ]
          </button>
          <button
            type="submit"
            disabled={generated === null || typed === ''}
            className={ACTION_BTN}
          >
            [ Apply ]
          </button>
        </div>
      </form>
    </div>
  );
}