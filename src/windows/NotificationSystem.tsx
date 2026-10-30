import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useNotificationStore } from '@core/stores/notificationStore';
import type { AppNotification } from '@core/stores/notificationStore';
import { getAppMeta } from '@windows/appRegistry';

const AUTO_DISMISS_MS = 6000;

interface NotificationCardProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}

function NotificationCard({ notification, onDismiss }: NotificationCardProps) {
  const { id, title, message, appId } = notification;
  const Icon = getAppMeta(appId)?.icon;

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(id), AUTO_DISMISS_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [id, onDismiss]);

  return (
    <motion.div
      layout
      role="status"
      initial={{ opacity: 0, x: 120 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="pointer-events-auto flex items-start gap-3 bg-[#1A1A1D]/95 backdrop-blur border border-white/10 rounded-lg p-3 w-80 shadow-2xl"
    >
      {Icon ? <Icon size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-neutral-300" /> : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-xs font-semibold text-neutral-100">{title}</span>
        <span className="break-words text-xs text-neutral-400">{message}</span>
      </div>
      <button
        type="button"
        aria-label="Tutup notifikasi"
        onClick={() => onDismiss(id)}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-white/10 hover:text-white"
      >
        <X size={12} strokeWidth={1.75} />
      </button>
    </motion.div>
  );
}

export function NotificationSystem() {
  const notifications = useNotificationStore((s) => s.notifications);
  const removeNotification = useNotificationStore((s) => s.removeNotification);

  return (
    <div className="pointer-events-none absolute bottom-14 right-4 z-[9994] flex flex-col items-end gap-2">
      <AnimatePresence initial={false}>
        {notifications.map((n) => (
          <NotificationCard key={n.id} notification={n} onDismiss={removeNotification} />
        ))}
      </AnimatePresence>
    </div>
  );
}