import { z } from 'zod';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const ContactSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  status: z.enum(['online', 'offline']),
});

export const ChatMessageSchema = z.object({
  time: z.string().regex(TIME_PATTERN, 'Format waktu harus HH:MM'),
  from: z.string().min(1),
  text: z.string().min(1),
});

export const ChatThreadSchema = z.object({
  id: z.string().min(1),
  contactId: z.string().min(1),
  messages: z.array(ChatMessageSchema),
  locked: z.boolean().optional(),
  inputDisabled: z.boolean().optional(),
  inputDisabledReason: z.string().optional(),
});

export const ChatDataSchema = z.object({
  contacts: z.array(ContactSchema),
  threads: z.array(ChatThreadSchema),
});

export type Contact = z.infer<typeof ContactSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatThread = z.infer<typeof ChatThreadSchema>;
export type ChatData = z.infer<typeof ChatDataSchema>;