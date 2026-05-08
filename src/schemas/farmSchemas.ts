import { z } from 'zod';

// Schema cho dữ liệu trả về của một Farm
export const farmResponseSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

// Schema cho dữ liệu trả về của API GET /api/v1/farms
export const getFarmsResponseSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
  data: z.array(farmResponseSchema),
  timestamp: z.string(),
});

// Schema cho dữ liệu trả về của API GET /api/v1/farms/summary
export const farmSummarySchema = z.object({
  farmId: z.string().uuid(),
  farmName: z.string(),
  description: z.string(),
  ownerId: z.string().uuid(),
  ownerFullName: z.string(),
  ownerAvatarUrl: z.string(),
  myRole: z.string(),
  owner: z.boolean(),
});

export const getFarmsSummaryResponseSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
  data: z.array(farmSummarySchema),
  timestamp: z.string(),
});

// Schema cho dữ liệu gửi đi khi tạo Farm mới (POST /api/v1/farms)
export const createFarmSchema = z.object({
  farmName: z.string().min(1, 'Tên farm không được để trống'),
  description: z.string(),
});

export type CreateFarmInput = z.infer<typeof createFarmSchema>;

export const createFarmResponseSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
  data: farmResponseSchema,
  timestamp: z.string().datetime(),
});

export const deleteFarmResponseSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
  data: z.string(),
  timestamp: z.string(),
});

export const farmEditSchema = z.object({
  name: z.string().min(1, 'Tên trang trại là bắt buộc').max(100, 'Tên không quá 100 ký tự'),
  description: z.string(),
  version: z.number().optional(),
});

export type FarmEditInput = z.infer<typeof farmEditSchema>;
