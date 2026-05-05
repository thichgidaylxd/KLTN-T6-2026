import { z } from 'zod';
import { apiResponseSchema } from './seasonPlanSchemas';

const employeeSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  status: z.string(),
  isLocked: z.boolean(),
  createdAt: z.string(),
});

const taskStatusSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  color: z.string(),
  isInitial: z.boolean().optional(),
  isTerminal: z.boolean().optional(),
});

const taskSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  startDate: z.string(),
  endDate: z.string(),
  status: taskStatusSchema,
  progressPercent: z.number(),
});

export const workLogSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['NORMAL', 'OVERTIME']),
  isOverTime: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(),
  workDate: z.string(),
  employee: employeeSchema.nullable().optional(),
  task: taskSchema.nullable().optional(),
  // Flat fields support (legacy or alternative API structure)
  employeeId: z.string().uuid().nullable().optional(),
  employeeName: z.string().nullable().optional(),
  taskId: z.string().uuid().nullable().optional(),
  taskName: z.string().nullable().optional(),
  farm: z.object({
    farmId: z.string().uuid().nullable().optional(),
    farmName: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    ownerId: z.string().uuid().nullable().optional(),
    ownerFullName: z.string().nullable().optional(),
    ownerAvatarUrl: z.string().nullable().optional(),
    myRole: z.string().nullable().optional(),
    owner: z.boolean().optional(),
  }).nullable().optional(),
});

export const workLogDetailSchema = workLogSchema.extend({
  shiftName: z.string().nullable().optional(),
  lockedAt: z.string().nullable().optional(),
  createdAt: z.string().nullable().optional(),
  materials: z.array(z.object({
    warehouseItemId: z.string().uuid(),
    warehouseItemName: z.string().optional(),
    usedQty: z.number(),
    unitCode: z.string().optional(),
    deviationReason: z.string().nullable().optional(),
  })).nullable().optional().default([]),
  overtime: z.boolean().nullable().optional(),
});


export const workLogSummarySchema = z.object({
  employeeId: z.string().uuid(),
  employeeName: z.string(),
  totalWorkDays: z.number(),
  totalOvertimeDays: z.number(),
  totalWage: z.number(),
});

export const getWorkLogsResponseSchema = apiResponseSchema(z.array(workLogSchema));
export const getWorkLogDetailResponseSchema = apiResponseSchema(workLogDetailSchema);
export const getWorkLogSummaryResponseSchema = apiResponseSchema(z.array(workLogSummarySchema));

export const createWorkLogSchema = z.object({
  workDate: z.string(),
  shiftId: z.string().uuid().nullable().optional(),
  type: z.enum(['NORMAL', 'OVERTIME']),
  notes: z.string().optional(),
  overtime: z.boolean(),
  materials: z.array(z.object({
    warehouseItemId: z.string().uuid(),
    fromLocationId: z.string().uuid(),
    usedQty: z.number().min(0),
    deviationReason: z.string().optional(),
  })),
});
