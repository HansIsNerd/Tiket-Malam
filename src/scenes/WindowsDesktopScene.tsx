import { useUiStore } from '@core/stores/uiStore';
import { Desktop } from '@windows/Desktop';
import { Taskbar } from '@windows/Taskbar';
import { WindowFrame } from '@windows/WindowFrame';

export function WindowsDesktopScene() {
  const windows = useUiStore((s) => s.windows);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-900 text-neutral-100">
      <Desktop />
      {windows.map((win) => (
        <WindowFrame key={win.id} window={win} />
      ))}
      <Taskbar />
    </div>
  );
}