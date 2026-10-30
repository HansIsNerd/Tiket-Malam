import { motion } from 'framer-motion';
import { useUiStore } from '@core/stores/uiStore';
import { APPS } from '@windows/appRegistry';

export function Desktop() {
  const openWindow = useUiStore((s) => s.openWindow);

  return (
    <div className="absolute inset-x-0 top-0 bottom-12 grid grid-flow-col grid-rows-[repeat(auto-fill,6rem)] content-start justify-start gap-1 p-3">
      {APPS.map(({ appId, title, icon: Icon, tileClass }) => (
        <motion.button
          key={appId}
          type="button"
          onClick={() => openWindow({ appId, title })}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="group flex h-24 w-24 flex-col items-center justify-center gap-2 rounded-xl text-[11px] text-white"
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-md ring-1 ring-white/10 transition-[filter] duration-200 group-hover:brightness-125 ${tileClass}`}
          >
            <Icon size={24} strokeWidth={2} className="text-white" />
          </div>
          <span className="[text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">{title}</span>
        </motion.button>
      ))}
    </div>
  );
}