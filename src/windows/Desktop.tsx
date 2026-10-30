import { useEffect } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { loadMailData } from '@core/services/dataLoader';
import { Desktop } from '@windows/Desktop';
import { Taskbar } from '@windows/Taskbar';
import { WindowFrame } from '@windows/WindowFrame';

export function WindowsDesktopScene() {
  const windows = useUiStore((s) => s.windows);
  const mailData = useGameStore((s) => s.mailData);
  const setMailData = useGameStore((s) => s.setMailData);

  useEffect(() => {
    if (mailData) return;
    let cancelled = false;
    loadMailData()
      .then((data) => {
        if (!cancelled) setMailData(data);
      })
      .catch((err: unknown) => {
        console.warn(err);
      });
    return () => {
      cancelled = true;
    };
  }, [mailData, setMailData]);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-900 text-neutral-100">
      <Desktop />
      {windows.map((win) => (
        <WindowFrame key={win.id} window={win} />
      ))}
      <Taskbar />
    </div>
  );
}