import { useGameStore } from '@core/stores/gameStore';
import type { FlagPath } from '@core/stores/gameStore';
import { useNotificationStore } from '@core/stores/notificationStore';
import { useUiStore } from '@core/stores/uiStore';
import { EventDataSchema } from '@core/types/events';
import type { EventAction, EventCondition, GameEvent } from '@core/types/events';

const EVENT_DATA_URL = '/data/events.json';
const MAX_PASSES = 10;
const DAY_MINUTES = 24 * 60;
const SHIFT_WRAP_MINUTES = 12 * 60;
const IDLE_NUDGE_MINUTES = 2;
const CHAT_WINDOW = { appId: 'chat', title: 'Chat', size: { width: 900, height: 500 } } as const;

type GameSnapshot = ReturnType<typeof useGameStore.getState>;

interface DartoNudge {
  threadId: string;
  message: string;
  sentFlag: FlagPath;
}

const TICKET_NUDGE: DartoNudge = {
  threadId: 'chat_darto_nudge_ticket',
  message: 'Mas, tiket dari bagas.p tolong dicek dulu.',
  sentFlag: 'act1.dartoNudgeTicketSent',
};

const REMOTE_NUDGE: DartoNudge = {
  threadId: 'chat_darto_nudge_remote',
  message: 'Mas, printer L4 itu bisa di-remote dari aplikasi Remote.',
  sentFlag: 'act1.dartoNudgeRemoteSent',
};

let loadedEvents: GameEvent[] = [];
const firedOnce = new Set<string>();
let evaluating = false;
let pending = false;
let idleSince = 0;

function toShiftMinutes(time: string): number {
  const match = /^\s*(\d{1,2}):(\d{2})\s*$/.exec(time);
  if (!match) {
    console.warn(`[EventEngine] Format waktu tidak valid: "${time}"`);
    return Number.NaN;
  }
  const total = Number(match[1]) * 60 + Number(match[2]);
  return total < SHIFT_WRAP_MINUTES ? total + DAY_MINUTES : total;
}

function readFlag(state: GameSnapshot, path: string): boolean | number | string | undefined {
  const [section, key] = path.split('.');
  if (!section || !key) return undefined;
  const bucket = (state.flags as unknown as Record<string, Record<string, unknown>>)[section];
  const value = bucket?.[key];
  return typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string'
    ? value
    : undefined;
}

function checkCondition(state: GameSnapshot, cond: EventCondition): boolean {
  switch (cond.type) {
    case 'flag': {
      const current = readFlag(state, cond.path);
      if (cond.value === undefined) return Boolean(current);
      return current === cond.value;
    }
    case 'time_after': {
      const now = toShiftMinutes(state.timeCurrent);
      const target = toShiftMinutes(cond.time);
      if (Number.isNaN(now) || Number.isNaN(target)) return false;
      return now >= target;
    }
    case 'act_is':
      return state.act === cond.act;
    case 'and':
      return cond.conditions.every((c) => checkCondition(state, c));
    case 'or':
      return cond.conditions.some((c) => checkCondition(state, c));
    case 'not':
      return !checkCondition(state, cond.condition);
  }
}

function runAction(action: EventAction): void {
  const game = useGameStore.getState();
  switch (action.type) {
    case 'set_flag':
      game.setFlag(action.path as FlagPath, action.value as never);
      break;
    case 'show_notification':
      useNotificationStore.getState().addNotification(action.payload);
      break;
    case 'set_time':
      game.setTime(action.time);
      break;
    case 'advance_act':
      game.setAct(action.act);
      break;
    case 'play_audio':
      break;
    case 'open_chat_thread': {
      const ui = useUiStore.getState();
      ui.unlockChatThread(action.threadId);
      ui.openWindow({ ...CHAT_WINDOW });
      break;
    }
  }
}

export function evaluateEvents(_gameState?: GameSnapshot): void {
  if (loadedEvents.length === 0) return;
  if (evaluating) {
    pending = true;
    return;
  }
  evaluating = true;
  try {
    do {
      pending = false;
      const firedThisCall = new Set<string>();
      for (let pass = 0; pass < MAX_PASSES; pass += 1) {
        let firedAny = false;
        for (const event of loadedEvents) {
          if (firedThisCall.has(event.id)) continue;
          if (event.once && firedOnce.has(event.id)) continue;
          const state = useGameStore.getState();
          if (!checkCondition(state, event.condition)) continue;
          firedThisCall.add(event.id);
          if (event.once) firedOnce.add(event.id);
          event.actions.forEach(runAction);
          firedAny = true;
        }
        if (!firedAny) break;
      }
    } while (pending);
  } finally {
    evaluating = false;
    pending = false;
  }
}

function hasVisibleWindow(): boolean {
  return useUiStore.getState().windows.some((w) => !w.isMinimized && !w.isHidden);
}

function resetIdle(): void {
  const now = toShiftMinutes(useGameStore.getState().timeCurrent);
  if (!Number.isNaN(now)) idleSince = now;
}

function pickNudge(state: GameSnapshot): DartoNudge | null {
  if (state.act !== 1) return null;
  const a1 = state.flags.act1;
  if (!a1.ticket4471Seen) return a1.dartoNudgeTicketSent ? null : TICKET_NUDGE;
  if (!a1.remoteOpened) return a1.dartoNudgeRemoteSent ? null : REMOTE_NUDGE;
  return null;
}

function sendDartoNudge(nudge: DartoNudge): void {
  useGameStore.getState().setFlag(nudge.sentFlag, true as never);
  useUiStore.getState().unlockChatThread(nudge.threadId);
  useNotificationStore.getState().addNotification({
    title: 'Pak Darto',
    message: nudge.message,
    appId: 'chat',
  });
}

function checkIdle(): void {
  const state = useGameStore.getState();
  const now = toShiftMinutes(state.timeCurrent);
  if (Number.isNaN(now)) return;
  if (hasVisibleWindow() || now < idleSince) {
    idleSince = now;
    return;
  }
  if (now - idleSince < IDLE_NUDGE_MINUTES) return;
  idleSince = now;
  const nudge = pickNudge(state);
  if (nudge) sendDartoNudge(nudge);
}

async function loadEvents(): Promise<GameEvent[]> {
  const response = await fetch(EVENT_DATA_URL);
  if (!response.ok) {
    throw new Error(`Gagal memuat ${EVENT_DATA_URL}: HTTP ${response.status}`);
  }
  const result = EventDataSchema.safeParse(await response.json());
  if (!result.success) {
    if (import.meta.env.DEV) {
      const details = result.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('\n');
      throw new Error(`Validasi ${EVENT_DATA_URL} gagal:\n${details}`);
    }
    throw new Error('Data permainan tidak valid');
  }
  return result.data.events;
}

export function startEventEngine(): () => void {
  let cancelled = false;

  firedOnce.clear();
  evaluating = false;
  pending = false;
  idleSince = 0;
  resetIdle();

  const unsubscribeGame = useGameStore.subscribe((state, prev) => {
    evaluateEvents();
    if (state.timeCurrent !== prev.timeCurrent) checkIdle();
  });

  const unsubscribeUi = useUiStore.subscribe((state, prev) => {
    if (state.windows !== prev.windows) resetIdle();
  });

  loadEvents()
    .then((events) => {
      if (cancelled) return;
      loadedEvents = events;
      evaluateEvents();
    })
    .catch((err: unknown) => {
      console.error(err);
    });

  return () => {
    cancelled = true;
    unsubscribeGame();
    unsubscribeUi();
  };
}