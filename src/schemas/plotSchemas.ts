import { z } from 'zod';

// Schema cho GeoJSON Geometry
export const geometrySchema = z.object({
  type: z.string().default('Polygon'),
  coordinates: z.array(z.array(z.array(z.number()))),
});

// Schema cho một Plot đơn lẻ

// có thê vẽ or không
export const plotSchema = z.object({
  id: z.string().uuid(),
  version: z.number().optional(),
  name: z.string(),
  areaHa: z.number().nullish().transform(v => v ?? 0),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  description: z.string().nullish().transform(v => v ?? undefined),
  geometry: geometrySchema.nullish().transform(v => v ?? undefined),
});

// Schema cho Payload tạo Plot mới — geometry KHÔNG bắt buộc
export const createPlotSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên lô đất'),
  geometry: geometrySchema.optional().nullable(),
  description: z.string().optional().nullable(),
});

// Base Response Schema
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    code: z.number(),
    message: z.string(),
    data: dataSchema,
    timestamp: z.string(),
  });

// Specific Response Schemas
export const getPlotsResponseSchema = apiResponseSchema(z.array(plotSchema));
export const createPlotResponseSchema = apiResponseSchema(plotSchema);

// Schema cho Payload cập nhật Plot
export const updatePlotSchema = z.object({
  name: z.string().trim().min(1, 'Vui lòng nhập tên lô đất').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  description: z.string().optional().nullable(),
  geometry: geometrySchema.optional(),
  isClearDescription: z.boolean().optional(),
  isClearGeometry: z.boolean().optional(),
});

export const updatePlotResponseSchema = apiResponseSchema(plotSchema);
