import { useUiStore } from '@core/stores/uiStore';
import { MacDesktop } from '@macos/MacDesktop';
import { MacWindowFrame } from '@macos/MacWindowFrame';

export function MacOSScene() {
  const macWindows = useUiStore((s) => s.macWindows);

  return (
    <div className="relative h-full w-full overflow-hidden bg-black text-white">
      <MacDesktop />
      {macWindows.map((w) =>
        w.isMinimized ? null : <MacWindowFrame key={w.id} window={w} />,
      )}
    </div>
  );
}