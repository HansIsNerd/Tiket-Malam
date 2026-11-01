import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUiStore } from '@core/stores/uiStore';
import { startEventEngine } from '@core/services/eventEngine';
import { startGameClock } from '@core/services/gameClock';
import { ContentWarningScene } from '@scenes/ContentWarningScene';
import { MainMenuScene } from '@scenes/MainMenuScene';
import { BootScene } from '@scenes/BootScene';
import { WindowsDesktopScene } from '@scenes/WindowsDesktopScene';

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
    default:
      return null;
  }
}

export default function App() {
  const scene = useUiStore((s) => s.scene);
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