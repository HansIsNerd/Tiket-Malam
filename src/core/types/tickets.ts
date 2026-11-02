import { z } from 'zod';

export const TicketPrioritySchema = z.enum(['low', 'medium', 'high']);
export const TicketMinigameSchema = z.enum([
  'terminal',
  'dropdown',
  // >>> START PATCH
  'print_spooler',
  // <<< END PATCH
  'code_completion',
  'cable',
  'password',
]);

export const TicketSchema = z.object({
  id: z.string().min(1),
  number: z.number().int().positive(),
  title: z.string().min(1),
  status: z.enum(['open', 'closed']),
  from: z.string().min(1).optional(),
  createdAt: z.string().min(1).optional(),
  priority: TicketPrioritySchema.optional(),
  description: z.string().min(1).optional(),
  closedBy: z.string().min(1).optional(),
  closedAt: z.string().min(1).optional(),
  resolution: z.string().min(1).optional(),
  hasCloseButton: z.boolean().optional(),
  closeButtonDisappears: z.boolean().optional(),
  hasRemoteButton: z.boolean().optional(),
  minigame: TicketMinigameSchema.optional(),
  doneFlag: z.string().min(1).optional(),
  hiddenUntilFlag: z.string().min(1).optional(),
});

export const TicketDataSchema = z.object({
  tickets: z.array(TicketSchema),
});

export type TicketPriority = z.infer<typeof TicketPrioritySchema>;
export type TicketMinigame = z.infer<typeof TicketMinigameSchema>;
export type Ticket = z.infer<typeof TicketSchema>;
export type TicketData = z.infer<typeof TicketDataSchema>;