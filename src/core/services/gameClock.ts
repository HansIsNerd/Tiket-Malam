import { useGameStore } from '@core/stores/gameStore';

const TICK_MS = 4000;
const DAY_MINUTES = 24 * 60;

function formatMinutes(total: number): string {
  const wrapped = ((total % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
  const h = String(Math.floor(wrapped / 60)).padStart(2, '0');
  const m = String(wrapped % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function parseMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (Number.isFinite(h) ? (h as number) : 0) * 60 + (Number.isFinite(m) ? (m as number) : 0);
}

export function startGameClock(): () => void {
  const timer = window.setInterval(() => {
    const state = useGameStore.getState();
    if (state.flags.act2.e10Instruction) return;
    state.setTime(formatMinutes(parseMinutes(state.timeCurrent) + 1));
  }, TICK_MS);

  return () => {
    window.clearInterval(timer);
  };
}