import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import { loadChatData } from '@core/services/dataLoader';
import { loadAllData } from '@core/services/dataLoader';

const FAKE_LOADING_MS = 2000;

export function BootScene() {
  const defaultName = useGameStore((s) => s.playerName);
  const completeBoot = useGameStore((s) => s.completeBoot);
  const setChatData = useGameStore((s) => s.setChatData);
  const setTicketData = useGameStore((s) => s.setTicketData);
  const setMailData = useGameStore((s) => s.setMailData);
  const setFileData = useGameStore((s) => s.setFileData);

  const [name, setName] = useState<string>(defaultName);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAllData()
      .then(({ chatData, ticketData, mailData, fileData }) => {
        if (cancelled) return;
        setChatData(chatData);
        setTicketData(ticketData);
        setMailData(mailData);
        setFileData(fileData);
      })
      .catch((err: unknown) => {
        console.warn(err);
      });
    return () => {
      cancelled = true;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [setChatData, setTicketData, setMailData, setFileData]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) return;

    const submitted = name;
    setIsLoading(true);
    timerRef.current = window.setTimeout(() => {
      completeBoot(submitted);
    }, FAKE_LOADING_MS);
  };

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-neutral-950 text-neutral-200">
      <form
        onSubmit={handleSubmit}
        className="flex w-80 flex-col items-center gap-4 border border-neutral-800 bg-neutral-900 p-8"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-neutral-800 text-3xl font-semibold">
          {(name.trim().charAt(0) || '?').toUpperCase()}
        </div>

        {isLoading ? (
          <p className="py-6 text-sm text-neutral-400">Memuat profil...</p>
        ) : (
          <>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama"
              maxLength={24}
              autoFocus
              className="w-full border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-400"
            />
            <button
              type="submit"
              className="w-full bg-neutral-200 px-3 py-2 text-sm font-semibold tracking-wide text-neutral-900 hover:bg-white"
            >
              MASUK
            </button>
          </>
        )}
      </form>
    </main>
  );
}