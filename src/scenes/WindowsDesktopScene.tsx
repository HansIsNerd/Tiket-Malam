import { useEffect } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { loadFileData } from '@core/services/dataLoader';
import { playAmbient, setMasterVolume, stopAmbient } from '@core/services/audioService';
import { Desktop } from '@windows/Desktop';
import { Taskbar } from '@windows/Taskbar';
import { WindowFrame } from '@windows/WindowFrame';
import { NotificationSystem } from '@windows/NotificationSystem';
import { BlackoutOverlay } from '@windows/BlackoutOverlay';

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
    setMasterVolume(useUiStore.getState().volume);
    playAmbient();
    return () => {
      stopAmbient();
    };
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#000000] text-neutral-100">
      <div className="relative h-full w-full">
        <Desktop />
        {windows.map((w) =>
          w.isMinimized === true ? null : <WindowFrame key={w.id} window={w} />,
        )}
        <NotificationSystem />
        <Taskbar />
      </div>
      <BlackoutOverlay />
    </div>
  );
}