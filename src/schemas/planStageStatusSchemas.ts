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

export const planStageStatusChangeSchema = z.object({
  fromStatus: statusObjectSchema,
  toStatus: statusObjectSchema,
  changedBy: actorSchema,
  changedAt: z.string(),
});

export const planStageStatusTransitionSchema = z.object({
  id: z.string().uuid(),
  fromStatus: statusObjectSchema,
  toStatus: statusObjectSchema,
  farmRole: z.object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string().optional(),
  }),
  createdAt: z.string(),
});

export const updatePlanStageStatusResponseSchema = apiResponseSchema(planStageStatusChangeSchema);
export const getPlanStageStatusHistoriesResponseSchema = apiResponseSchema(z.array(planStageStatusChangeSchema));
export const getPlanStageStatusesResponseSchema = apiResponseSchema(z.array(statusObjectSchema));
export const getPlanStageStatusTransitionsResponseSchema = apiResponseSchema(z.array(planStageStatusTransitionSchema));
