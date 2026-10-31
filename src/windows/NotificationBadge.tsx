interface NotificationBadgeProps {
  count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count <= 0) return null;
  return (
    <span
      role="status"
      aria-label={`${count} belum dibaca`}
      className="pointer-events-none absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-none text-white shadow ring-1 ring-black/40"
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}