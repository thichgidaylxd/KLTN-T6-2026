import { z } from 'zod';
import { statusObjectSchema, apiResponseSchema } from './seasonPlanSchemas';

export const apiTaskMaterialSchema = z.object({
  id: z.string().uuid(),
  plannedQty: z.number(),
  task: z.object({
    id: z.string().uuid(),
    name: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: statusObjectSchema,
  }),
  warehouseItem: z.object({
    id: z.string().uuid(),
    name: z.string(),
    sku: z
      .object({
        sku: z.string(),
        description: z.string().nullable().optional(),
        createdAt: z.string().optional(),
      })
      .nullable()
      .optional(),
    unit: z
      .object({
        id: z.string().uuid(),
        code: z.string(),
        name: z.string(),
      })
      .nullable()
      .optional(),
  }),
});

export const getTaskMaterialsResponseSchema = apiResponseSchema(z.array(apiTaskMaterialSchema));
export const addTaskMaterialResponseSchema = apiResponseSchema(apiTaskMaterialSchema);

export const createTaskMaterialSchema = z.object({
  warehouseItemId: z.string().uuid('Vui lòng chọn vật tư trong kho'),
  plannedQty: z.coerce.number({ invalid_type_error: 'Số lượng phải là số' }),
});
