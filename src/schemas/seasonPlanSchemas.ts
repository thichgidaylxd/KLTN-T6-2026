import { z } from 'zod';

// Schema for Status Object
export const statusObjectSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  color: z.string(),
  isInitial: z.boolean().optional(),
  isTerminal: z.boolean().optional(),
});

// Enum for Plan Status (legacy/simple)
export const planStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'READY_TO_HARVEST', 'HARVESTING', 'COMPLETED', 'CANCELLED', 'UNASSIGNED', 'ASSIGNED', 'OVERDUE']);

// Schema for a single Plan from API
export const apiPlanSchema = z.object({
  id: z.string().uuid(),
  version: z.number().optional(),
  farmId: z.string().uuid(),
  clonedFromId: z.string().uuid().nullable().optional(),
  name: z.string(),
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string(),   // YYYY-MM-DD
  status: z.union([planStatusSchema, statusObjectSchema]),
  note: z.string().nullable().optional(),
  createdById: z.string().uuid().nullable().optional(),
  createdAt: z.string().optional(),
  deletedAt: z.string().nullable().optional(),
  // cropId và plotId không trực tiếp trên Plan object trong Swagger mới
});


// Schema for Plan Stage (Phase)
export const apiPlanStageSchema = z.object({
  id: z.string().uuid(),
  version: z.number().optional(),
  planId: z.string().uuid(),
  farmId: z.string().uuid().nullable().optional(),
  name: z.string(),
  source: z.enum(['TEMPLATE', 'MANUAL', 'CUSTOM']).optional(),
  orderIndex: z.number().optional(),
  startDate: z.string(),
  endDate: z.string(),
  aiSuggestionCache: z.string().nullable().optional(),
  status: statusObjectSchema,
});

// Schema for Task
export const apiTaskSchema = z.object({
  id: z.string().uuid(),
  version: z.number().optional(),
  planStageId: z.string().uuid(),
  farmId: z.string().uuid().nullable().optional(),
  plotId: z.string().uuid().nullable().optional(),
  status: statusObjectSchema,
  name: z.string(),
  description: z.string().nullable().optional(),
  startDate: z.string(),
  endDate: z.string(),
  progressPercent: z.number().default(0),
  acceptedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  createdBy: z.string().uuid().optional(),
  createdAt: z.string().optional(),
});

// Schema cho API Response
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    code: z.number(),
    message: z.string(),
    data: dataSchema,
    timestamp: z.string(),
  });

export const getPlansResponseSchema = apiResponseSchema(z.array(apiPlanSchema));
export const createPlanResponseSchema = apiResponseSchema(apiPlanSchema);
export const getStagesResponseSchema = apiResponseSchema(z.array(apiPlanStageSchema));
export const createStageResponseSchema = apiResponseSchema(apiPlanStageSchema);
export const getTasksResponseSchema = apiResponseSchema(z.array(apiTaskSchema));
export const createTaskResponseSchema = apiResponseSchema(apiTaskSchema);


// Schema for Plan Plot assignments
export const planPlotSchema = z.object({
  plotId: z.string().uuid(),
  plotName: z.string(),
});

export const getPlanPlotsResponseSchema = apiResponseSchema(z.array(planPlotSchema));
export const addPlanPlotsResponseSchema = apiResponseSchema(z.object({
  planId: z.string().uuid(),
  addedPlots: z.array(planPlotSchema),
}));


// Schema cho Payload tạo Plan mới
export const createPlanRequestSchema = z.object({
  cropId: z.string().min(1, 'Vui lòng chọn cây trồng mục tiêu'),
  name: z.string().trim().min(1, 'Vui lòng nhập tên kế hoạch'),
  startDate: z.string().min(1, 'Vui lòng nhập ngày bắt đầu hợp lệ (dd/mm/yyyy)'),
  endDate: z.string().min(1, 'Vui lòng nhập ngày kết thúc hợp lệ (dd/mm/yyyy)'),
  note: z.string().optional(),
});

// Schema cho Payload tạo Phase mới
export const createPhaseSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên giai đoạn'),
  startDate: z.string().min(1, 'Vui lòng nhập ngày bắt đầu hợp lệ (dd/mm/yyyy)'),
  endDate: z.string().min(1, 'Vui lòng nhập ngày kết thúc hợp lệ (dd/mm/yyyy)'),
});

// Schema cho Payload clone Plan
export const clonePlanSchema = z.object({
  newName: z.string().trim().min(1, 'Vui lòng nhập tên kế hoạch mới'),
  newStartDate: z.string().min(1, 'Vui lòng nhập ngày bắt đầu hợp lệ (dd/mm/yyyy)'),
});

// Schema cho Payload tạo Task mới
export const createTaskSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên công việc'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Vui lòng nhập ngày bắt đầu'),
  endDate: z.string().min(1, 'Vui lòng nhập ngày kết thúc'),
  plotId: z.string().nullable().optional(),
});



