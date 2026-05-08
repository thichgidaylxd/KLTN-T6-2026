import { z } from 'zod';

/**
 * Zod schemas cho Plan API
 * Đồng bộ với API request/response schemas
 */

// Schema cho tạo plan mới
export const createPlanSchema = z.object({
  cropId: z.string().uuid('ID cây trồng không hợp lệ').min(1, 'Vui lòng chọn cây trồng'),
  name: z.string().min(1, 'Tên kế hoạch không được để trống').max(200, 'Tên quá dài'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu không hợp lệ (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kết thúc không hợp lệ (YYYY-MM-DD)'),
  note: z.string().optional(),
}).refine(
  (data) => data.startDate <= data.endDate,
  {
    message: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc',
    path: ['endDate'],
  },
);

// Schema cho cập nhật thời gian plan
export const updatePlanTimeSchema = z.object({
  version: z.number().int().min(0, 'Version không hợp lệ'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu không hợp lệ'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kết thúc không hợp lệ'),
}).refine(
  (data) => data.startDate <= data.endDate,
  {
    message: 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc',
    path: ['endDate'],
  },
);

// Schema cho thêm plots vào plan
export const addPlotsToPlanSchema = z.object({
  plotIds: z.array(z.string().uuid('ID plot không hợp lệ')).min(1, 'Phải chọn ít nhất 1 plot'),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanTimeInput = z.infer<typeof updatePlanTimeSchema>;
export type AddPlotsToPlanInput = z.infer<typeof addPlotsToPlanSchema>;
