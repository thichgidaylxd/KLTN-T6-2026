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

// Schema for User Object (in status history)
export const userObjectSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  status: z.string(),
  isLocked: z.boolean(),
  createdAt: z.string(),
});

// Schema for Plan Stage Status History
export const planStageStatusHistorySchema = z.object({
  fromStatus: statusObjectSchema,
  toStatus: statusObjectSchema,
  changedBy: userObjectSchema,
  changedAt: z.string(),
});

// Schema for Plan Stage Status Transition
export const farmRoleObjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
});

export const planStageStatusTransitionSchema = z.object({
  id: z.string().uuid(),
  fromStatus: statusObjectSchema,
  toStatus: statusObjectSchema,
  farmRole: farmRoleObjectSchema,
  createdAt: z.string(),
});

// Enum for Plan Status (legacy/simple)
export const planStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'READY_TO_HARVEST', 'HARVESTING', 'COMPLETED', 'CANCELLED', 'UNASSIGNED', 'ASSIGNED', 'OVERDUE']);

// Schema for Plan Plot assignments
export const planPlotSchema = z.object({
  plotId: z.string().uuid(),
  plotName: z.string(),
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
  actualStartDate: z.string().nullable().optional(),
  actualEndDate: z.string().nullable().optional(),
  aiSuggestionCache: z.string().nullable().optional(),
  status: statusObjectSchema,
  tasks: z.array(z.any()).optional(), // Will be populated by fetchTasks if needed
});

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
  cropId: z.string().uuid().nullable().optional(),
  phases: z.array(apiPlanStageSchema).optional(),
  plots: z.array(planPlotSchema).optional(),
});



// Schema for Task
export const apiTaskSchema = z.object({
  id: z.string().uuid(),
  version: z.number().optional(),
  planStageId: z.string().uuid(),
  farmId: z.string().uuid().nullable().optional(),
  farmName: z.string().nullable().optional(),
  plotId: z.string().uuid().nullable().optional(),
  status: statusObjectSchema,
  name: z.string(),
  description: z.string().nullable().optional(),
  startDate: z.string(),
  actualStartDate: z.string().nullable().optional(),
  endDate: z.string(),
  actualEndDate: z.string().nullable().optional(),
  progressPercent: z.number().default(0),
  acceptedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  createdBy: z.string().uuid().optional(),
  createdAt: z.string().optional(),
  dependencies: z.array(z.any()).optional(),
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

// ── Task Status schemas ──
export const farmObjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const taskStatusHistorySchema = z.object({
  fromStatus: statusObjectSchema,
  toStatus: statusObjectSchema,
  changedBy: userObjectSchema,
  changedAt: z.string(),
});

export const taskStatusTransitionSchema = z.object({
  id: z.string().optional(),
  farm: farmObjectSchema.optional(),
  fromStatus: statusObjectSchema,
  toStatus: statusObjectSchema,
  farmRole: farmRoleObjectSchema,
  createdAt: z.string(),
});

// Response schemas
export const getTaskStatusesResponseSchema = apiResponseSchema(z.array(statusObjectSchema));
export const getTaskStatusTransitionsResponseSchema = apiResponseSchema(z.array(taskStatusTransitionSchema));
export const getTaskStatusHistoriesResponseSchema = apiResponseSchema(z.array(taskStatusHistorySchema));
export const getAvailableTaskStatusesResponseSchema = apiResponseSchema(z.array(statusObjectSchema));
export const updateTaskStatusResponseSchema = apiResponseSchema(taskStatusHistorySchema);

// ── Existing response schemas ──
export const getPlansResponseSchema = apiResponseSchema(z.array(apiPlanSchema));
export const createPlanResponseSchema = apiResponseSchema(apiPlanSchema);
export const getStagesResponseSchema = apiResponseSchema(z.array(apiPlanStageSchema));
export const getStageResponseSchema = apiResponseSchema(apiPlanStageSchema);
export const createStageResponseSchema = apiResponseSchema(apiPlanStageSchema);
export const updateStageTimeResponseSchema = apiResponseSchema(apiPlanStageSchema);
export const updateStageResponseSchema = apiResponseSchema(apiPlanStageSchema);
export const deleteStageResponseSchema = apiResponseSchema(z.string());
export const getTasksResponseSchema = apiResponseSchema(z.array(apiTaskSchema));
export const createTaskResponseSchema = apiResponseSchema(apiTaskSchema);

export const getPlanPlotsResponseSchema = apiResponseSchema(z.array(planPlotSchema));
export const addPlanPlotsResponseSchema = apiResponseSchema(z.object({
  planId: z.string().uuid(),
  addedPlots: z.array(planPlotSchema),
}));


// Response schemas moved up to use apiPlanSchema

// Plan Stage Status APIs
export const updateStageStatusResponseSchema = apiResponseSchema(planStageStatusHistorySchema);
export const getStageStatusHistoriesResponseSchema = apiResponseSchema(z.array(planStageStatusHistorySchema));
export const getAvailableStatusesResponseSchema = apiResponseSchema(z.array(statusObjectSchema));
export const getAllPlanStageStatusesResponseSchema = apiResponseSchema(z.array(statusObjectSchema));
export const getPlanStageStatusTransitionsResponseSchema = apiResponseSchema(z.array(planStageStatusTransitionSchema));


// Schema cho Payload tạo Plan mới
export const createPlanRequestSchema = z.object({
  cropId: z.string().min(1, 'Vui lòng chọn cây trồng mục tiêu'),
  name: z.string().trim().min(1, 'Vui lòng nhập tên kế hoạch'),
  startDate: z.string().min(1, 'Vui lòng nhập ngày bắt đầu hợp lệ (dd/mm/yyyy)'),
  endDate: z.string().min(1, 'Vui lòng nhập ngày kết thúc hợp lệ (dd/mm/yyyy)'),
  note: z.string().optional(),
});

// Schema cho Payload tạo Stage mới
export const createStageSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên giai đoạn'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu không hợp lệ (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kết thúc không hợp lệ (YYYY-MM-DD)'),
}).refine(
  (data) => data.startDate <= data.endDate,
  {
    message: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc',
    path: ['endDate'],
  },
);

// Schema cho Payload cập nhật thời gian Stage (PUT /time)
export const updateStageTimeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu không hợp lệ'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kết thúc không hợp lệ'),
}).refine(
  (data) => data.startDate <= data.endDate,
  {
    message: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc',
    path: ['endDate'],
  },
);

// Schema cho Payload cập nhật Stage (PATCH)
export const updateStageSchema = z.object({
  name: z.string().trim().min(1, 'Tên giai đoạn không được để trống').optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu không hợp lệ').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kết thúc không hợp lệ').optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc',
    path: ['endDate'],
  },
);

export type CreateStageInput = z.infer<typeof createStageSchema>;
export type UpdateStageTimeInput = z.infer<typeof updateStageTimeSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;

// Schema cho Payload clone Plan
export const clonePlanSchema = z.object({
  newName: z.string().trim().min(1, 'Vui lòng nhập tên kế hoạch mới'),
  newStartDate: z.string().min(1, 'Vui lòng nhập ngày bắt đầu hợp lệ (dd/mm/yyyy)'),
});

// Schema cho Payload tạo Task mới
export const createTaskSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên công việc'),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu không hợp lệ (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kết thúc không hợp lệ (YYYY-MM-DD)'),
  plotId: z.string().uuid().nullable().optional(),
}).refine(
  (data) => data.startDate <= data.endDate,
  {
    message: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc',
    path: ['endDate'],
  },
);

// ── Task Dependency schemas ──
export const createTaskDependencyResponseSchema = apiResponseSchema(
  z.object({
    task: apiTaskSchema,
    dependsOnTask: apiTaskSchema,
  })
);

export const getTaskDependenciesResponseSchema = apiResponseSchema(
  z.object({
    task: apiTaskSchema,
    dependsOnTasks: z.array(apiTaskSchema),
  })
);

export const deleteTaskDependencyResponseSchema = apiResponseSchema(z.string());

// ── Task Assignee schemas ──
export const taskAssigneeSchema = z.object({
  id: z.string().uuid(),
  user: userObjectSchema,
  assigneeBy: userObjectSchema,
  assigneeAt: z.string(),
  removedBy: userObjectSchema.optional(),
  removedAt: z.string().nullable().optional(),
});

export const taskAssigneeWithTaskSchema = taskAssigneeSchema.extend({
  task: apiTaskSchema,
});

export const createTaskAssigneeRequestSchema = z.object({
  userId: z.string().uuid(),
});

export const removeTaskAssigneeRequestSchema = z.object({
  removalReason: z.string().optional(),
});

export const getTaskAssigneesResponseSchema = apiResponseSchema(z.array(taskAssigneeSchema));
export const createTaskAssigneeResponseSchema = apiResponseSchema(taskAssigneeWithTaskSchema);
export const removeTaskAssigneeResponseSchema = apiResponseSchema(taskAssigneeSchema);






