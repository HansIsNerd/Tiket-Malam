import { useUiStore } from '@core/stores/uiStore';

export function Desktop() {
  const openWindow = useUiStore((s) => s.openWindow);

  return (
    <div className="absolute inset-0 bottom-12 p-4">
      <button
        type="button"
        onDoubleClick={() => openWindow({ appId: 'dummy', title: 'Dummy App' })}
        className="flex w-20 flex-col items-center gap-1 rounded p-2 text-xs hover:bg-white/10"
      >
        <span className="h-10 w-10 rounded border-2 border-neutral-300" />
        <span>Dummy</span>
      </button>
    </div>
  );
}