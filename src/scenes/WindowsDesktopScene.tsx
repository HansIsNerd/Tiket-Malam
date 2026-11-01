import { useEffect } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { loadFileData } from '@core/services/dataLoader';
import { startEventEngine } from '@core/services/eventEngine';
import { startGameClock } from '@core/services/gameClock';
import { playAmbient, setMasterVolume, stopAmbient } from '@core/services/audioService';
import { Desktop } from '@windows/Desktop';
import { Taskbar } from '@windows/Taskbar';
import { WindowFrame } from '@windows/WindowFrame';
import { NotificationSystem } from '@windows/NotificationSystem';
import { BlackoutOverlay } from '@windows/BlackoutOverlay';
import { EndScreen } from '@scenes/EndScreen';

export function WindowsDesktopScene() {
  const windows = useUiStore((s) => s.windows);
  const fileData = useGameStore((s) => s.fileData);
  const setFileData = useGameStore((s) => s.setFileData);
  const act3Started = useGameStore((s) => s.flags.act3.started);

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
    const stopEngine = startEventEngine();
    const stopClock = startGameClock();
    return () => {
      stopEngine();
      stopClock();
    };
  }, []);

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
      {act3Started ? <EndScreen /> : null}
    </div>
  );
}