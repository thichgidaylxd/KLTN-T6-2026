import { z } from 'zod';

/**
 * Zod schemas cho Task Material API
 * Đồng bộ với API request/response schemas
 */

// Schema cho thêm vật tư vào task (POST)
export const createTaskMaterialSchema = z.object({
  plannedQty: z.number().min(0, 'Số lượng phải lớn hơn hoặc bằng 0'),
  warehouseItemId: z.string().uuid('ID vật tư không hợp lệ'),
});

export type CreateTaskMaterialInput = z.infer<typeof createTaskMaterialSchema>;
