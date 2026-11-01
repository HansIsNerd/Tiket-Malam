import { motion } from 'framer-motion';

interface RemoteWebcamProps {
  chairShifted: boolean;
}

export function RemoteWebcam({ chairShifted }: RemoteWebcamProps) {
  return (
    <div
      role="img"
      aria-label="Pratinjau webcam"
      className="pointer-events-none absolute bottom-9 right-3 z-[5] h-28 w-44 overflow-hidden border border-neutral-600 bg-neutral-900 shadow-[0_6px_18px_rgba(0,0,0,0.6)]"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-700/40 to-black/70" />

      <div className="absolute left-[10%] top-[18%] h-10 w-14 rounded-sm bg-neutral-700/60" />

      <motion.div
        aria-label={chairShifted ? 'Kursi bergeser' : 'Kursi'}
        initial={false}
        animate={{ x: chairShifted ? 22 : 0, rotate: chairShifted ? 16 : 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="absolute left-[58%] top-[44%] h-8 w-7 rounded-sm bg-neutral-600/80"
      />

      <div className="absolute bottom-0 left-[32%] flex flex-col items-center">
        <div className="h-9 w-9 rounded-full bg-neutral-950" />
        <div className="-mt-1 h-14 w-20 rounded-t-3xl bg-neutral-950" />
      </div>

      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0px,rgba(255,255,255,0.04)_1px,transparent_1px,transparent_3px)]" />

      <span className="absolute left-1.5 top-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-neutral-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        CAM-01
      </span>
    </div>
  );
}