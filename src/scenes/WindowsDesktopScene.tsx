import { useEffect, useState } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { loadFileData } from '@core/services/dataLoader';
import { startEventEngine } from '@core/services/eventEngine';
import { startGameClock } from '@core/services/gameClock';
import { playAmbient, setMasterVolume, stopAmbient } from '@core/services/audioService';
import { cx } from '@core/utils/cx';
import { Desktop } from '@windows/Desktop';
import { Taskbar } from '@windows/Taskbar';
import { WindowFrame } from '@windows/WindowFrame';
import { NotificationSystem } from '@windows/NotificationSystem';
import { EndScreen } from '@scenes/EndScreen';

const GLITCH_DURATION_MS = 5000;
const GRAYSCALE_FADE_MS = 4000;

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
    const timer = window.setTimeout(() => setShowEnd(true), GLITCH_DURATION_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [e10Instruction]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-900 text-neutral-100">
      <div
        className={cx('relative h-full w-full', e10Instruction && 'glitch-active')}
        style={{
          filter: e10Instruction ? 'grayscale(100%)' : 'grayscale(0%)',
          transition: `filter ${GRAYSCALE_FADE_MS}ms ease-in-out`,
        }}
      >
        <Desktop />
        {windows.map((w) =>
          w.isMinimized === true ? null : <WindowFrame key={w.id} window={w} />,
        )}
        <NotificationSystem />
        <Taskbar />
      </div>
      <div
        aria-hidden="true"
        className={cx('crt-scanlines', e10Instruction && 'crt-scanlines-on')}
      />
      {showEnd ? <EndScreen /> : null}
    </div>
  );
}