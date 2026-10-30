import { z } from 'zod';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export type EventCondition =
  | { type: 'flag'; path: string; value?: boolean | number }
  | { type: 'time_after'; time: string }
  | { type: 'act_is'; act: number }
  | { type: 'and'; conditions: EventCondition[] }
  | { type: 'or'; conditions: EventCondition[] }
  | { type: 'not'; condition: EventCondition };

export const EventConditionSchema: z.ZodType<EventCondition> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('flag'),
      path: z.string().min(1),
      value: z.union([z.boolean(), z.number()]).optional(),
    }),
    z.object({
      type: z.literal('time_after'),
      time: z.string().regex(TIME_PATTERN, 'Format waktu harus HH:MM'),
    }),
    z.object({ type: z.literal('act_is'), act: z.number().int() }),
    z.object({ type: z.literal('and'), conditions: z.array(EventConditionSchema) }),
    z.object({ type: z.literal('or'), conditions: z.array(EventConditionSchema) }),
    z.object({ type: z.literal('not'), condition: EventConditionSchema }),
  ]),
);

export const NotificationPayloadSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  appId: z.string().min(1),
});

export const EventActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('set_flag'),
    path: z.string().min(1),
    value: z.union([z.boolean(), z.number()]),
  }),
  z.object({
    type: z.literal('show_notification'),
    payload: NotificationPayloadSchema,
  }),
  z.object({
    type: z.literal('set_time'),
    time: z.string().regex(TIME_PATTERN, 'Format waktu harus HH:MM'),
  }),
  z.object({ type: z.literal('advance_act'), act: z.number().int() }),
]);

export const GameEventSchema = z.object({
  id: z.string().min(1),
  once: z.boolean().default(true),
  condition: EventConditionSchema,
  actions: z.array(EventActionSchema),
});

export const EventDataSchema = z.object({
  _schema: z.literal(1),
  events: z.array(GameEventSchema),
});

export type EventAction = z.infer<typeof EventActionSchema>;
export type GameEvent = z.infer<typeof GameEventSchema>;
export type EventData = z.infer<typeof EventDataSchema>;