import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Accessibility, ArrowRight, Power, Wifi } from 'lucide-react';
import { useGameStore } from '@core/stores/gameStore';
import { loadAllData } from '@core/services/dataLoader';
import { audioService } from '@core/services/audioService';

const WALLPAPER_URL =
  'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920';
const FAKE_LOADING_MS = 2000;
const FADE = { duration: 0.35, ease: 'easeOut' } as const;

export function BootScene() {
  const playerName = useGameStore((s) => s.playerName);
  const timeCurrent = useGameStore((s) => s.timeCurrent);
  const completeBoot = useGameStore((s) => s.completeBoot);
  const setChatData = useGameStore((s) => s.setChatData);
  const setTicketData = useGameStore((s) => s.setTicketData);
  const setMailData = useGameStore((s) => s.setMailData);
  const setFileData = useGameStore((s) => s.setFileData);
  const setDirectoryData = useGameStore((s) => s.setDirectoryData);

  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadAllData()
      .then(({ chatData, ticketData, mailData, fileData, directoryData }) => {
        if (cancelled) return;
        setChatData(chatData);
        setTicketData(ticketData);
        setMailData(mailData);
        setFileData(fileData);
        setDirectoryData(directoryData);
      })
      .catch((err: unknown) => {
        console.warn(err);
      });
    return () => {
      cancelled = true;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [setChatData, setTicketData, setMailData, setFileData, setDirectoryData]);

  const startLogin = () => {
    if (isLoading) return;
    audioService.playAmbient();
    setIsLoading(true);
    timerRef.current = window.setTimeout(() => {
      completeBoot();
    }, FAKE_LOADING_MS);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startLogin();
  };

  const initial = (playerName.trim().charAt(0) || '?').toUpperCase();

  return (
    <main
      className="relative h-full w-full overflow-hidden bg-cover bg-center text-white"
      style={{ backgroundImage: `url(${WALLPAPER_URL})` }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="absolute inset-0">
        <span className="absolute left-4 top-4 select-none text-xs text-white/70">
          Shift Malam — {timeCurrent}
        </span>

        <div className="absolute left-1/2 top-1/2 flex w-80 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-neutral-500 text-5xl font-light text-white shadow-lg shadow-black/40">
            {initial}
          </div>

          <h1 className="text-2xl font-light">{playerName}</h1>

          <div className="flex h-24 w-full flex-col items-center justify-start">
            <AnimatePresence mode="wait" initial={false}>
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={FADE}
                  className="flex flex-col items-center gap-4"
                >
                  <p className="text-sm text-white">Selamat datang</p>
                  <motion.span
                    aria-label="Memuat"
                    role="status"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
                    className="block h-8 w-8 rounded-full border-2 border-white/30 border-t-white"
                  />
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  onSubmit={handleSubmit}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={FADE}
                  className="flex w-full items-center gap-2"
                >
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Kata Sandi"
                    autoFocus
                    autoComplete="off"
                    className="min-w-0 flex-1 border-b-2 border-white/60 bg-transparent px-1 py-2 text-white outline-none transition-colors placeholder:text-white/50 focus:border-white"
                  />
                  <button
                    type="submit"
                    aria-label="Masuk"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 bg-transparent text-white transition-colors hover:bg-white/15"
                  >
                    <ArrowRight size={18} strokeWidth={2} />
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        <span className="absolute bottom-4 left-4 select-none text-sm text-white">
          Nusa Data Solusi
        </span>

        <div className="absolute bottom-4 right-4 flex items-center gap-1 text-white">
          <button
            type="button"
            aria-label="Jaringan"
            className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-white/10"
          >
            <Wifi size={18} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Kemudahan akses"
            className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-white/10"
          >
            <Accessibility size={18} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            aria-label="Daya"
            className="flex h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-white/10"
          >
            <Power size={18} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </main>
  );
}