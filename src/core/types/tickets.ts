import { z } from 'zod';

export const TicketPrioritySchema = z.enum(['low', 'medium', 'high']);

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
});

export const TicketDataSchema = z.object({
  tickets: z.array(TicketSchema),
});

export type TicketPriority = z.infer<typeof TicketPrioritySchema>;
export type Ticket = z.infer<typeof TicketSchema>;
export type TicketData = z.infer<typeof TicketDataSchema>;