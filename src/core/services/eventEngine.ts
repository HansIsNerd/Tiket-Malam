import { useGameStore } from '@core/stores/gameStore';
import type { FlagPath } from '@core/stores/gameStore';
import { useNotificationStore } from '@core/stores/notificationStore';
import { EventDataSchema } from '@core/types/events';
import type { EventAction, EventCondition, GameEvent } from '@core/types/events';

const EVENT_DATA_URL = '/data/events.json';
const MAX_PASSES = 10;
const DAY_MINUTES = 24 * 60;
const SHIFT_WRAP_MINUTES = 12 * 60;

type GameSnapshot = ReturnType<typeof useGameStore.getState>;

let loadedEvents: GameEvent[] = [];
const firedOnce = new Set<string>();
let evaluating = false;

function toShiftMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  const total = (h ?? 0) * 60 + (m ?? 0);
  return total < SHIFT_WRAP_MINUTES ? total + DAY_MINUTES : total;
}

function readFlag(state: GameSnapshot, path: string): boolean | number | undefined {
  const [section, key] = path.split('.');
  if (!section || !key) return undefined;
  const bucket = (state.flags as unknown as Record<string, Record<string, unknown>>)[section];
  const value = bucket?.[key];
  return typeof value === 'boolean' || typeof value === 'number' ? value : undefined;
}

function checkCondition(state: GameSnapshot, cond: EventCondition): boolean {
  switch (cond.type) {
    case 'flag': {
      const current = readFlag(state, cond.path);
      if (cond.value === undefined) return Boolean(current);
      return current === cond.value;
    }
    case 'time_after':
      return toShiftMinutes(state.timeCurrent) >= toShiftMinutes(cond.time);
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
  }
}

export function evaluateEvents(gameState: GameSnapshot): void {
  if (evaluating || loadedEvents.length === 0) return;
  evaluating = true;
  try {
    const firedThisCall = new Set<string>();
    let state = gameState;
    for (let pass = 0; pass < MAX_PASSES; pass += 1) {
      let firedAny = false;
      for (const event of loadedEvents) {
        if (firedThisCall.has(event.id)) continue;
        if (event.once && firedOnce.has(event.id)) continue;
        if (!checkCondition(state, event.condition)) continue;
        firedThisCall.add(event.id);
        if (event.once) firedOnce.add(event.id);
        event.actions.forEach(runAction);
        firedAny = true;
        state = useGameStore.getState();
      }
      if (!firedAny) break;
    }
  } finally {
    evaluating = false;
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

  const unsubscribe = useGameStore.subscribe((state) => {
    evaluateEvents(state);
  });

  loadEvents()
    .then((events) => {
      if (cancelled) return;
      loadedEvents = events;
      evaluateEvents(useGameStore.getState());
    })
    .catch((err: unknown) => {
      console.warn(err);
    });

  return () => {
    cancelled = true;
    unsubscribe();
  };
}