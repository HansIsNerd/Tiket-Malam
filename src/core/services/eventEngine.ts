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
const CHAT_WINDOW = { appId: 'chat', title: 'Chat', size: { width: 900, height: 500 } } as const;

type GameSnapshot = ReturnType<typeof useGameStore.getState>;

let loadedEvents: GameEvent[] = [];
const firedOnce = new Set<string>();
let evaluating = false;
let pending = false;

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
          console.log(`[EventEngine] FIRE ${event.id}`);
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

  const unsubscribe = useGameStore.subscribe(() => {
    evaluateEvents();
  });

  loadEvents()
    .then((events) => {
      if (cancelled) return;
      loadedEvents = events;
      console.log(`[EventEngine] Loaded ${events.length} events`);
      evaluateEvents();
    })
    .catch((err: unknown) => {
      console.error(err);
    });

  return () => {
    cancelled = true;
    unsubscribe();
  };
}