import { useEffect } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { loadFileData } from '@core/services/dataLoader';
import { startEventEngine } from '@core/services/eventEngine';
import { Desktop } from '@windows/Desktop';
import { Taskbar } from '@windows/Taskbar';
import { WindowFrame } from '@windows/WindowFrame';
import { NotificationSystem } from '@windows/NotificationSystem';

export function WindowsDesktopScene() {
  const windows = useUiStore((s) => s.windows);
  const fileData = useGameStore((s) => s.fileData);
  const setFileData = useGameStore((s) => s.setFileData);

  useEffect(() => {
    if (fileData) return;
    let cancelled = false;
    loadFileData()
      .then((data) => {
        if (!cancelled) setFileData(data);
      })
      .catch((err: unknown) => {
        console.warn(err);
      });
    return () => {
      cancelled = true;
    };
  }, [fileData, setFileData]);

  useEffect(() => {
    const stop = startEventEngine();
    return stop;
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-900 text-neutral-100">
      <Desktop />
      {windows.map((w) =>
        w.isMinimized === true ? null : <WindowFrame key={w.id} window={w} />,
      )}
      <NotificationSystem />
      <Taskbar />
    </div>
  );
}