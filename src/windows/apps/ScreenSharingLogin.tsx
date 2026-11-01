import { useState } from 'react';
import type { FormEvent } from 'react';
import { Monitor, X } from 'lucide-react';

const SESSION_USER = 'bagas.p';
const SESSION_HOST = 'MacBook-Bagas';
const SESSION_PASSWORD = '0340';

interface ScreenSharingLoginProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ScreenSharingLogin({ onClose, onSuccess }: ScreenSharingLoginProps) {
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<boolean>(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password.trim() === SESSION_PASSWORD) {
      onSuccess();
      return;
    }
    setError(true);
    setPassword('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Screen Sharing"
      onClick={onClose}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-[340px] max-w-full flex-col gap-4 rounded-[12px] border border-black/20 bg-[#ECECEE] p-5 text-neutral-800 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-b from-[#5AB4F5] to-[#1F72D8]">
              <Monitor size={20} strokeWidth={1.75} className="text-white" />
            </span>
            <div className="flex flex-col">
              <h2 className="text-[14px] font-semibold">Screen Sharing</h2>
              <p className="text-[12px] text-neutral-500">{SESSION_HOST}</p>
            </div>
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

        <label className="flex flex-col gap-1 text-[12px] text-neutral-600">
          Nama
          <input
            type="text"
            value={SESSION_USER}
            readOnly
            className="rounded-md border border-black/15 bg-black/5 px-2 py-1.5 text-[13px] text-neutral-700 outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-[12px] text-neutral-600">
          Kata Sandi
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
            autoFocus
            autoComplete="off"
            className="rounded-md border border-black/15 bg-white px-2 py-1.5 text-[13px] text-neutral-900 outline-none focus:border-[#1F72D8]"
          />
        </label>

        {error ? (
          <p role="alert" className="text-[12px] text-red-600">
            Nama atau kata sandi salah.
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-7 rounded-md border border-black/20 bg-white px-4 text-[13px] font-medium transition-colors hover:bg-neutral-100"
          >
            Batal
          </button>
          <button
            type="submit"
            className="h-7 rounded-md bg-[#1F72D8] px-4 text-[13px] font-medium text-white transition-[filter] hover:brightness-110"
          >
            Masuk
          </button>
        </div>
      </form>
    </div>
  );
}