import { motion } from 'framer-motion';
import { useGameStore } from '@core/stores/gameStore';
import { useUiStore } from '@core/stores/uiStore';
import { cx } from '@core/utils/cx';
import { getAppMeta } from '@windows/appRegistry';

export function Taskbar() {
  const timeCurrent = useGameStore((s) => s.timeCurrent);
  const windows = useUiStore((s) => s.windows);
  const focusWindow = useUiStore((s) => s.focusWindow);
  const minimizeWindow = useUiStore((s) => s.minimizeWindow);

  return (
    <footer className="absolute inset-x-0 bottom-0 z-[9999] grid h-12 grid-cols-[1fr_auto_1fr] items-center border-t border-white/10 bg-[#1A1A1D]/80 px-2 backdrop-blur-lg">
      <div className="flex items-center justify-start">
        <button
          type="button"
          className="h-9 rounded-md px-4 text-sm font-semibold text-neutral-100 transition-colors hover:bg-white/10"
        >
          Start
        </button>
      </div>

      <div className="flex items-center justify-center gap-1">
        {windows
          .filter((win) => !win.isHidden)
          .map((win) => {
            const Icon = getAppMeta(win.appId)?.icon;
            const isActive = win.isFocused && !win.isMinimized;
            return (
              <motion.button
                key={win.id}
                type="button"
                title={win.title}
                aria-label={win.title}
                onClick={() =>
                  isActive ? minimizeWindow(win.id) : focusWindow(win.id)
                }
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={cx(
                  'relative flex h-10 w-10 items-center justify-center rounded-md text-neutral-100 transition-colors hover:bg-white/10',
                  isActive && 'bg-white/10',
                )}
              >
                {Icon ? <Icon size={20} strokeWidth={1.5} /> : null}
                <span
                  className={cx(
                    'absolute bottom-[3px] h-[3px] rounded-full transition-[width,background-color] duration-200',
                    isActive ? 'w-4 bg-sky-400' : 'w-1.5 bg-neutral-400',
                  )}
                />
              </motion.button>
            );
          })}
      </div>

      <div className="flex items-center justify-end">
        <span className="px-3 text-sm tabular-nums text-neutral-300">
          {timeCurrent}
        </span>
      </div>
    </footer>
  );
}