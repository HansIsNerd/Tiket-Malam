import { useEffect, useState } from 'react';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { loadAllData } from '@core/services/dataLoader';
import { startEventEngine } from '@core/services/eventEngine';
import { startGameClock } from '@core/services/gameClock';
import { playAmbient, setMasterVolume, stopAmbient } from '@core/services/audioService';
import { Desktop } from '@windows/Desktop';
import { Taskbar } from '@windows/Taskbar';
import { WindowFrame } from '@windows/WindowFrame';
import { NotificationSystem } from '@windows/NotificationSystem';
import { EndScreen } from '@scenes/EndScreen';

const SILENCE_MS = 10000;
const FADE_OUT_MS = 3000;

export function WindowsDesktopScene() {
  const windows = useUiStore((s) => s.windows);
  const e10Instruction = useGameStore((s) => s.flags.act2.e10Instruction);
  const [fading, setFading] = useState<boolean>(false);
  const [showEnd, setShowEnd] = useState<boolean>(false);

  // >>> START PATCH
  useEffect(() => {
    const s = useGameStore.getState();
    if (s.chatData && s.ticketData && s.mailData && s.fileData && s.directoryData) return;
    let cancelled = false;
    loadAllData()
      .then((d) => {
        if (cancelled) return;
        const g = useGameStore.getState();
        g.setChatData(d.chatData);
        g.setTicketData(d.ticketData);
        g.setMailData(d.mailData);
        g.setFileData(d.fileData);
        g.setDirectoryData(d.directoryData);
      })
      .catch((err: unknown) => {
        console.warn(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  // <<< END PATCH

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
      setFading(false);
      setShowEnd(false);
      return;
    }
    const fadeTimer = window.setTimeout(() => {
      setFading(true);
      stopAmbient(FADE_OUT_MS);
    }, SILENCE_MS);
    const endTimer = window.setTimeout(() => setShowEnd(true), SILENCE_MS + FADE_OUT_MS);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(endTimer);
    };
  }, [e10Instruction]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#000000] text-neutral-100">
      <div
        className="relative h-full w-full"
        style={{
          opacity: fading ? 0 : 1,
          transition: `opacity ${FADE_OUT_MS}ms ease-in-out`,
          pointerEvents: fading ? 'none' : 'auto',
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