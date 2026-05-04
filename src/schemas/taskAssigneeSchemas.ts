import { z } from 'zod';
import { apiResponseSchema } from './seasonPlanSchemas';

const taskAssigneeUserSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  status: z.string(),
  isLocked: z.boolean(),
  createdAt: z.string(),
});

export const taskAssigneeSchema = z.object({
  id: z.string().uuid(),
  user: taskAssigneeUserSchema,
  assigneeBy: taskAssigneeUserSchema.nullable().optional(),
  assigneeAt: z.string(),
  removedBy: taskAssigneeUserSchema.nullable().optional(),
  removedAt: z.string().nullable().optional(),
});

export const getTaskAssigneesResponseSchema = apiResponseSchema(z.array(taskAssigneeSchema));
export const addTaskAssigneeResponseSchema = apiResponseSchema(taskAssigneeSchema);
export const deleteTaskAssigneeResponseSchema = apiResponseSchema(taskAssigneeSchema);

export const createTaskAssigneeSchema = z.object({
  userId: z.string().uuid('Vui lòng chọn thành viên hợp lệ'),
});

export const createTaskAssigneesSchema = z.object({
  userIds: z.array(z.string().uuid('Vui lòng chọn thành viên hợp lệ')),
});
