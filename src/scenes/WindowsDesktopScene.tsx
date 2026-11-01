import { useEffect, useState } from 'react';
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
import { EndScreen } from '@scenes/EndScreen';

const FADE_OUT_MS = 3000;

export function WindowsDesktopScene() {
  const windows = useUiStore((s) => s.windows);
  const fileData = useGameStore((s) => s.fileData);
  const setFileData = useGameStore((s) => s.setFileData);
  const e10Instruction = useGameStore((s) => s.flags.act2.e10Instruction);
  const [showEnd, setShowEnd] = useState<boolean>(false);

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

  useEffect(() => {
    if (!e10Instruction) {
      setShowEnd(false);
      return;
    }
    stopAmbient(FADE_OUT_MS);
    const timer = window.setTimeout(() => setShowEnd(true), FADE_OUT_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [e10Instruction]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#000000] text-neutral-100">
      <div
        className="relative h-full w-full"
        style={{
          opacity: e10Instruction ? 0 : 1,
          transition: `opacity ${FADE_OUT_MS}ms ease-in-out`,
          pointerEvents: e10Instruction ? 'none' : 'auto',
        }}
      >
        <Desktop />
        {windows.map((w) =>
          w.isMinimized === true ? null : <WindowFrame key={w.id} window={w} />,
        )}
        <NotificationSystem />
        <Taskbar />
      </div>
      {showEnd ? <EndScreen /> : null}
    </div>
  );
}