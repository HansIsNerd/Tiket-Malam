import { z } from 'zod';

export const FileItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['text']),
  content: z.string(),
});

export const FileDataSchema = z.object({
  files: z.array(FileItemSchema),
});

export type FileItem = z.infer<typeof FileItemSchema>;
export type FileData = z.infer<typeof FileDataSchema>;