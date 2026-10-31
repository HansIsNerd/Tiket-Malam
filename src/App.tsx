import { useLayoutEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
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
  const setScene = useUiStore((s) => s.setScene);
  const content = renderScene(scene);

  // >>> START PATCH
  useLayoutEffect(() => {
    const inGame = useGameStore.getState().inGame;
    if (inGame && useUiStore.getState().scene === 'warning') {
      setScene('windows');
    }
  }, [setScene]);
  // <<< END PATCH

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