import { useEffect } from 'react';
import { useGameStore } from '@core/stores/gameStore';

const TICK_MS = 1000;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function addOneMinute(time: string): string {
  const [rawHour, rawMinute] = time.split(':').map(Number);
  let hour = Number.isFinite(rawHour) ? (rawHour as number) : 0;
  let minute = Number.isFinite(rawMinute) ? (rawMinute as number) : 0;

  minute += 1;
  if (minute >= 60) {
    minute = 0;
    hour += 1;
    if (hour >= 24) hour = 0;
  }

  return `${pad(hour)}:${pad(minute)}`;
}

export function useGameClock(): void {
  useEffect(() => {
    const interval = window.setInterval(() => {
      const { timeCurrent, setTime } = useGameStore.getState();
      setTime(addOneMinute(timeCurrent));
    }, TICK_MS);

    return () => {
      window.clearInterval(interval);
    };
  }, []);
}