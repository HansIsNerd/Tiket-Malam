import { useRef } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { motion } from 'framer-motion';
import { useUiStore } from '@core/stores/uiStore';
import type { Position, WindowInstance } from '@core/types';
import { cx } from '@core/utils/cx';
import { Copy, Minus, Square, X } from 'lucide-react';
import { getAppMeta } from '@windows/appRegistry';

import { DummyApp } from '@windows/apps/DummyApp';
import { ChatApp } from '@windows/apps/ChatApp';
import { TicketApp } from '@windows/apps/TicketApp';
import { MailApp } from '@windows/apps/MailApp';
import { FileExplorerApp } from '@windows/apps/FileExplorerApp';
import { DirectoryApp } from '@windows/apps/DirectoryApp';
import { RemoteApp } from '@windows/apps/RemoteApp';

interface WindowFrameProps {
  window: WindowInstance;
}

interface DragState {
  pointerId: number;
  offsetX: number;
  offsetY: number;
}

const CONTROL_BTN = 'flex h-8 w-11 items-center justify-center transition-colors hover:bg-white/10';

function renderApp(appId: string) {
  switch (appId) {
    case 'chat':
      return <ChatApp />;
    case 'ticket':
      return <TicketApp />;
    case 'mail':
      return <MailApp />;
    case 'files':
      return <FileExplorerApp />;
    case 'directory':
      return <DirectoryApp />;
    case 'remote':
      return <RemoteApp />;
    case 'dummy':
    default:
      return <DummyApp />;
  }
}

export function WindowFrame({ window: win }: WindowFrameProps) {
  const focusWindow = useUiStore((s) => s.focusWindow);
  const closeWindow = useUiStore((s) => s.closeWindow);
  const moveWindow = useUiStore((s) => s.moveWindow);
  const minimizeWindow = useUiStore((s) => s.minimizeWindow);
  const toggleMaximize = useUiStore((s) => s.toggleMaximizeWindow);
  const dragRef = useRef<DragState | null>(null);

  if (win.isMinimized || win.isHidden) return null;

  const AppIcon = getAppMeta(win.appId)?.icon;

  const handleTitlePointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || win.isMaximized) return;
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

  const frameStyle: CSSProperties = win.isMaximized
    ? { left: 0, top: 0, width: '100%', height: 'calc(100% - 3rem)', zIndex: win.zIndex }
    : {
        left: win.position.x,
        top: win.position.y,
        width: win.size.width,
        height: win.size.height,
        zIndex: win.zIndex,
      };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      onPointerDown={() => focusWindow(win.id)}
      style={frameStyle}
      className={cx(
        'absolute flex flex-col overflow-hidden border bg-[#1E1E22] transition-[box-shadow,border-color] duration-200',
        win.isMaximized ? 'rounded-none' : 'rounded-lg',
        win.isFocused
          ? 'border-white/20 border-t-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)]'
          : 'border-white/10 border-t-white/20 shadow-[0_10px_25px_rgba(0,0,0,0.35)]',
      )}
    >
      <header
        onPointerDown={handleTitlePointerDown}
        onPointerMove={handleTitlePointerMove}
        onPointerUp={handleTitlePointerUp}
        onPointerCancel={handleTitlePointerUp}
        onDoubleClick={() => toggleMaximize(win.id)}
        className={cx(
          'flex h-8 shrink-0 cursor-default touch-none select-none items-center justify-between bg-[#1E1E22]/90 pl-3 text-xs backdrop-blur-md',
          win.isFocused ? 'text-neutral-100' : 'text-neutral-400',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {AppIcon ? (
            <AppIcon size={14} strokeWidth={1.5} className="shrink-0" />
          ) : null}
          <span className="truncate">{win.title}</span>
        </span>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label="Minimize"
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onClick={() => minimizeWindow(win.id)}
            className={CONTROL_BTN}
          >
            <Minus size={14} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            aria-label={win.isMaximized ? 'Restore' : 'Maximize'}
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onClick={() => toggleMaximize(win.id)}
            className={CONTROL_BTN}
          >
            {win.isMaximized ? (
              <Copy size={13} strokeWidth={1.5} />
            ) : (
              <Square size={13} strokeWidth={1.5} />
            )}
          </button>
          <button
            type="button"
            aria-label="Close"
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onClick={() => closeWindow(win.id)}
            className="flex h-8 w-11 items-center justify-center transition-colors hover:bg-[#E81123] hover:text-white"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">{renderApp(win.appId)}</div>
    </motion.div>
  );
}