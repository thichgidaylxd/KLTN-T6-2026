import { z } from 'zod';

/**
 * Zod schemas cho Plot API
 * Đồng bộ với API request/response schemas
 */

// Geometry: GeoJSON format
const geometrySchema = z.object({
  type: z.string().min(1, 'Loại geometry không hợp lệ'),
  coordinates: z.array(z.array(z.array(z.number()))).min(1, 'Coordinates không hợp lệ'),
});

// Plot status enum
export const plotStatusSchema = z.enum(['ACTIVE', 'INACTIVE']);

// Schema cho tạo plot mới
export const createPlotSchema = z.object({
  plotName: z.string().min(1, 'Tên lô đất không được để trống').max(200, 'Tên quá dài'),
  geometry: geometrySchema,
  description: z.string().optional(),
});

// Schema cho cập nhật plot
export const updatePlotSchema = z.object({
  version: z.number().int().min(0, 'Version không hợp lệ'),
  name: z.string().min(1, 'Tên lô đất không được để trống').max(200, 'Tên quá dài').optional(),
  status: plotStatusSchema.optional(),
  geometry: geometrySchema.optional(),
  description: z.string().optional(),
  isClearDescription: z.boolean().optional(),
  isClearGeometry: z.boolean().optional(),
}).refine(
  (data) => !(data.isClearDescription && data.description !== undefined),
  {
    message: 'Không thể gửi isClearDescription cùng với description',
    path: ['isClearDescription'],
  },
).refine(
  (data) => !(data.isClearGeometry && data.geometry !== undefined),
  {
    message: 'Không thể gửi isClearGeometry cùng với geometry',
    path: ['isClearGeometry'],
  },
);

export type CreatePlotInput = z.infer<typeof createPlotSchema>;
export type UpdatePlotInput = z.infer<typeof updatePlotSchema>;
