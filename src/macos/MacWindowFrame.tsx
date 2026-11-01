import { useRef } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { motion } from 'framer-motion';
import { useUiStore } from '@core/stores/uiStore';
import type { MacWindowInstance } from '@core/stores/uiStore';
import type { Position } from '@core/types';
import { cx } from '@core/utils/cx';
import { MacFinderApp } from '@macos/apps/MacFinderApp';
import { MacNotesApp } from '@macos/apps/MacNotesApp';
import { MacTerminalApp } from '@macos/apps/MacTerminalApp';

interface MacWindowFrameProps {
  window: MacWindowInstance;
}

interface DragState {
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

const MENU_BAR_HEIGHT = 28;
const DOCK_RESERVE = 88;

const LIGHT_BASE =
  'h-3 w-3 rounded-full border border-black/15 transition-[filter] hover:brightness-90';

function renderMacApp(appId: string) {
  switch (appId) {
    case 'finder':
      return <MacFinderApp />;
    case 'notes':
      return <MacNotesApp />;
    case 'terminal':
      return <MacTerminalApp />;
    case 'messages':
      return <p className="p-4 text-sm text-neutral-700">Messages</p>;
    default:
      return null;
  }
}

export function MacWindowFrame({ window: win }: MacWindowFrameProps) {
  const focusMacWindow = useUiStore((s) => s.focusMacWindow);
  const closeMacWindow = useUiStore((s) => s.closeMacWindow);
  const moveMacWindow = useUiStore((s) => s.moveMacWindow);
  const minimizeMacWindow = useUiStore((s) => s.minimizeMacWindow);
  const toggleMaximize = useUiStore((s) => s.toggleMaximizeMacWindow);
  const dragRef = useRef<DragState | null>(null);

  const isTerminal = win.appId === 'terminal';

  const handlePointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || win.isMaximized) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - win.position.x,
      offsetY: e.clientY - win.position.y,
    };
  };

  const handlePointerMove = (e: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const next: Position = {
      x: e.clientX - drag.offsetX,
      y: Math.max(MENU_BAR_HEIGHT, e.clientY - drag.offsetY),
    };
    moveMacWindow(win.id, next);
  };

  const handlePointerUp = (e: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const frameStyle: CSSProperties = win.isMaximized
    ? {
        left: 0,
        top: MENU_BAR_HEIGHT,
        width: '100%',
        height: `calc(100% - ${MENU_BAR_HEIGHT + DOCK_RESERVE}px)`,
        zIndex: win.zIndex,
      }
    : {
        left: win.position.x,
        top: win.position.y,
        width: win.size.width,
        height: win.size.height,
        zIndex: win.zIndex,
      };

  const stop = (e: PointerEvent<HTMLElement>) => e.stopPropagation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      onPointerDown={() => focusMacWindow(win.id)}
      style={frameStyle}
      className={cx(
        'absolute flex flex-col overflow-hidden rounded-[14px] border',
        isTerminal ? 'bg-[#1C1C1E]/95 backdrop-blur-xl' : 'bg-[#F5F5F7]',
        win.isFocused
          ? 'border-black/30 shadow-[0_24px_60px_rgba(0,0,0,0.55)]'
          : 'border-black/15 shadow-[0_10px_30px_rgba(0,0,0,0.3)]',
      )}
    >
      <header
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={() => toggleMaximize(win.id)}
        className={cx(
          'relative flex h-11 shrink-0 cursor-default touch-none select-none items-center px-3.5',
          isTerminal ? 'bg-[#2A2A2D]' : 'bg-gradient-to-b from-[#ECECEE] to-[#DEDEE1]',
        )}
      >
        <div className="group flex items-center gap-2">
          <button
            type="button"
            aria-label="Tutup"
            onPointerDown={stop}
            onDoubleClick={(e) => e.stopPropagation()}
            onClick={() => closeMacWindow(win.id)}
            className={cx(LIGHT_BASE, win.isFocused ? 'bg-[#FF5F57]' : 'bg-neutral-400/70')}
          />
          <button
            type="button"
            aria-label="Minimize"
            onPointerDown={stop}
            onDoubleClick={(e) => e.stopPropagation()}
            onClick={() => minimizeMacWindow(win.id)}
            className={cx(LIGHT_BASE, win.isFocused ? 'bg-[#FEBC2E]' : 'bg-neutral-400/70')}
          />
          <button
            type="button"
            aria-label="Maximize"
            onPointerDown={stop}
            onDoubleClick={(e) => e.stopPropagation()}
            onClick={() => toggleMaximize(win.id)}
            className={cx(LIGHT_BASE, win.isFocused ? 'bg-[#28C840]' : 'bg-neutral-400/70')}
          />
        </div>
        <span
          className={cx(
            'pointer-events-none absolute inset-x-0 truncate px-20 text-center text-[13px] font-semibold',
            isTerminal ? 'text-neutral-300' : 'text-neutral-700',
            !win.isFocused && 'opacity-60',
          )}
        >
          {win.title}
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{renderMacApp(win.appId)}</div>
    </motion.div>
  );
}