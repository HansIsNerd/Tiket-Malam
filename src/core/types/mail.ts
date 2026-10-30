import { z } from 'zod';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const MailAttachmentSchema = z.object({
  id: z.string().min(1),
  fileName: z.string().min(1),
});

export const MailSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  subject: z.string().min(1),
  time: z.string().regex(TIME_PATTERN, 'Format waktu harus HH:MM'),
  body: z.string().min(1),
  unread: z.boolean(),
  attachments: z.array(MailAttachmentSchema).optional(),
});

export const MailDataSchema = z.object({
  mails: z.array(MailSchema),
});

export type MailAttachment = z.infer<typeof MailAttachmentSchema>;
export type Mail = z.infer<typeof MailSchema>;
export type MailData = z.infer<typeof MailDataSchema>;