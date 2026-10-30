import { useUiStore } from '@core/stores/uiStore';
import { BootScene } from '@scenes/BootScene';
import { WindowsDesktopScene } from '@scenes/WindowsDesktopScene';

export default function App() {
  const scene = useUiStore((s) => s.scene);

  switch (scene) {
    case 'boot':
      return <BootScene />;
    case 'windows':
      return <WindowsDesktopScene />;
    case 'macos':
    case 'ending':
    case 'menu':
      return null;
  }
}