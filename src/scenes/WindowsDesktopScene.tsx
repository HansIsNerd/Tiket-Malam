import { useEffect } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { loadFileData } from '@core/services/dataLoader';
import { Desktop } from '@windows/Desktop';
import { Taskbar } from '@windows/Taskbar';
import { WindowFrame } from '@windows/WindowFrame';

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

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-900 text-neutral-100">
      <Desktop />
      {windows.map((win) => (
        <WindowFrame key={win.id} window={win} />
      ))}
      <Taskbar />
    </div>
  );
} 