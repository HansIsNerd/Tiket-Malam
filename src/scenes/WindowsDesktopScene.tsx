import { useEffect, useState } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { loadFileData } from '@core/services/dataLoader';
import { startEventEngine } from '@core/services/eventEngine';
import { startGameClock } from '@core/services/gameClock';
import { Desktop } from '@windows/Desktop';
import { Taskbar } from '@windows/Taskbar';
import { WindowFrame } from '@windows/WindowFrame';
import { NotificationSystem } from '@windows/NotificationSystem';
import { EndScreen } from '@scenes/Endscreen';

const END_SCREEN_DELAY_MS = 5000;

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
    const stop = startEventEngine();
    return stop;
  }, []);

  useEffect(() => {
    const stop = startGameClock();
    return stop;
  }, []);

  useEffect(() => {
    if (!e10Instruction) return;
    const timer = window.setTimeout(() => setShowEnd(true), END_SCREEN_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [e10Instruction]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-900 text-neutral-100">
      <Desktop />
      {windows.map((w) =>
        w.isMinimized === true ? null : <WindowFrame key={w.id} window={w} />,
      )}
      <NotificationSystem />
      <Taskbar />
      {showEnd ? <EndScreen /> : null}
    </div>
  );
}