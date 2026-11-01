import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUiStore } from '@core/stores/uiStore';
import { useGameStore } from '@core/stores/gameStore';
import { startEventEngine } from '@core/services/eventEngine';
import { startGameClock } from '@core/services/gameClock';
import { ContentWarningScene } from '@scenes/ContentWarningScene';
import { MainMenuScene } from '@scenes/MainMenuScene';
import { BootScene } from '@scenes/BootScene';
import { WindowsDesktopScene } from '@scenes/WindowsDesktopScene';
import { MacOSScene } from '@scenes/MacOSScene';
import { EndingScene } from '@scenes/EndingScene';

const SCENE_TRANSITION = { duration: 0.5, ease: 'easeInOut' } as const;

function renderScene(scene: string) {
  switch (scene) {
    case 'warning':
      return <ContentWarningScene />;
    case 'menu':
      return <MainMenuScene />;
    case 'boot':
      return <BootScene />;
    case 'windows':
      return <WindowsDesktopScene />;
    case 'macos':
      return <MacOSScene />;
    case 'ending':
      return <EndingScene />;
    default:
      return null;
  }
}

export default function App() {
  const scene = useUiStore((s) => s.scene);
  const time = useGameStore((s) => s.timeCurrent);
  const content = renderScene(scene);

  useEffect(() => {
    const stopEngine = startEventEngine();
    return () => {
      stopEngine();
    };
  }, []);

  useEffect(() => {
    if (scene !== 'windows') return;
    const stopClock = startGameClock();
    return () => {
      stopClock();
    };
  }, [scene]);

  useEffect(() => {
    console.log('[App] Scene:', scene, 'Time:', time);
  }, [scene, time]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <AnimatePresence mode="wait" initial={false}>
        {content ? (
          <motion.div
            key={scene}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={SCENE_TRANSITION}
            className="h-full w-full"
          >
            {content}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}