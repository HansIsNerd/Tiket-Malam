import { z } from 'zod';

export const FileLocationSchema = z.enum(['desktop', 'floor4']);

export const FileItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['text']),
  content: z.string(),
  location: FileLocationSchema.optional(),
});

export const FileDataSchema = z.object({
  files: z.array(FileItemSchema),
});

export type FileLocation = z.infer<typeof FileLocationSchema>;
export type FileItem = z.infer<typeof FileItemSchema>;
export type FileData = z.infer<typeof FileDataSchema>;