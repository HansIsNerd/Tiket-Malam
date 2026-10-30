import { z } from 'zod';

export const EmployeeStatusSchema = z.enum(['active', 'resigned']);

export const EmployeeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  username: z.string().min(1).optional(),
  role: z.string().min(1),
  status: EmployeeStatusSchema,
  hasProfile: z.boolean().optional(),
  detail: z.string().min(1).optional(),
});

export const DirectoryDataSchema = z.object({
  employees: z.array(EmployeeSchema),
});

export type EmployeeStatus = z.infer<typeof EmployeeStatusSchema>;
export type Employee = z.infer<typeof EmployeeSchema>;
export type DirectoryData = z.infer<typeof DirectoryDataSchema>;