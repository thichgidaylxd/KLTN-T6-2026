import { z } from 'zod';
import { apiResponseSchema, statusObjectSchema } from './seasonPlanSchemas';

const actorSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  status: z.string(),
  isLocked: z.boolean(),
  createdAt: z.string(),
});

export const taskStatusObjectSchema = statusObjectSchema.extend({
  isInitial: z.boolean().optional(),
  isTerminal: z.boolean().optional(),
});

export const taskStatusChangeSchema = z.object({
  fromStatus: taskStatusObjectSchema,
  toStatus: taskStatusObjectSchema,
  changedBy: actorSchema,
  changedAt: z.string(),
});

export const taskStatusTransitionSchema = z.object({
  id: z.string().uuid().optional(),
  farm: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }).optional(),
  fromStatus: taskStatusObjectSchema,
  toStatus: taskStatusObjectSchema,
  farmRole: z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().nullable().optional(),
  }),
  createdAt: z.string(),
});

export const updateTaskStatusResponseSchema = apiResponseSchema(taskStatusChangeSchema);
export const getTaskStatusHistoriesResponseSchema = apiResponseSchema(z.array(taskStatusChangeSchema));
export const getTaskStatusesResponseSchema = apiResponseSchema(z.array(taskStatusObjectSchema));
export const getTaskStatusTransitionsResponseSchema = apiResponseSchema(z.array(taskStatusTransitionSchema));
