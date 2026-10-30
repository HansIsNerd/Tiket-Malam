import { useRef } from 'react';
import type { PointerEvent } from 'react';
import { useUiStore } from '@core/stores/uiStore';
import type { Position, WindowInstance } from '@core/types';
import { cx } from '@core/utils/cx';
import { DummyApp } from '@windows/apps/DummyApp';

interface WindowFrameProps {
  window: WindowInstance;
}

interface DragState {
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

function renderApp(appId: string) {
  switch (appId) {
    case 'dummy':
      return <DummyApp />;
    default:
      return null;
  }
}

export function WindowFrame({ window: win }: WindowFrameProps) {
  const focusWindow = useUiStore((s) => s.focusWindow);
  const closeWindow = useUiStore((s) => s.closeWindow);
  const moveWindow = useUiStore((s) => s.moveWindow);
  const dragRef = useRef<DragState | null>(null);

  if (win.isMinimized) return null;

  const handleTitlePointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - win.position.x,
      offsetY: e.clientY - win.position.y,
    };
  };

  const handleTitlePointerMove = (e: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const next: Position = {
      x: e.clientX - drag.offsetX,
      y: Math.max(0, e.clientY - drag.offsetY),
    };
    moveWindow(win.id, next);
  };

  const handleTitlePointerUp = (e: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <section
      onPointerDown={() => focusWindow(win.id)}
      style={{
        left: win.position.x,
        top: win.position.y,
        width: win.size.width,
        height: win.size.height,
        zIndex: win.zIndex,
      }}
      className={cx(
        'absolute flex flex-col border bg-neutral-800',
        win.isFocused ? 'border-neutral-300' : 'border-neutral-700',
      )}
    >
      <header
        onPointerDown={handleTitlePointerDown}
        onPointerMove={handleTitlePointerMove}
        onPointerUp={handleTitlePointerUp}
        onPointerCancel={handleTitlePointerUp}
        className={cx(
          'flex h-8 shrink-0 cursor-default touch-none select-none items-center justify-between px-2 text-sm',
          win.isFocused ? 'bg-neutral-600' : 'bg-neutral-700',
        )}
      >
        <span className="truncate">{win.title}</span>
        <button
          type="button"
          aria-label="Close"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => closeWindow(win.id)}
          className="px-2 hover:bg-red-600"
        >
          ×
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{renderApp(win.appId)}</div>
    </section>
  );
}