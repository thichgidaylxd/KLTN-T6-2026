import { z } from 'zod';

/**
 * Zod schemas cho module Quản lý danh mục cây trồng (PB10)
 * Đồng bộ với API thực tế của Backend
 */

// Schema validate CropType (khi tạo mới loại cây)
export const createCropTypeSchema = z.object({
  name: z.string().min(1, 'Tên loại cây không được để trống'),
  description: z.string().optional(),
});

// Schema cho form Giai đoạn sinh trưởng (lưu local, chờ API)
export const growthStageSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Tên giai đoạn là bắt buộc'),
  durationDays: z.number().min(1, 'Độ dài tối thiểu là 1 ngày').optional(),
  description: z.string().optional(),
});

// Schema cho form Điều kiện đất (lưu local, chờ API)
export const soilConditionSchema = z.object({
  phMin: z.number().min(0).max(14),
  phMax: z.number().min(0).max(14),
  nitrogenMin: z.number().min(0),
  nitrogenMax: z.number().min(0),
  phosphorusMin: z.number().min(0),
  phosphorusMax: z.number().min(0),
  potassiumMin: z.number().min(0),
  potassiumMax: z.number().min(0),
  moisturePercent: z.number().min(0).max(100).optional(),
}).refine((d) => d.phMin < d.phMax, { message: 'pH min phải nhỏ hơn pH max', path: ['phMax'] })
  .refine((d) => d.nitrogenMin < d.nitrogenMax, { message: 'Nitơ min phải nhỏ hơn max', path: ['nitrogenMax'] })
  .refine((d) => d.phosphorusMin < d.phosphorusMax, { message: 'Phốt pho min phải nhỏ hơn max', path: ['phosphorusMax'] })
  .refine((d) => d.potassiumMin < d.potassiumMax, { message: 'Kali min phải nhỏ hơn max', path: ['potassiumMax'] });

// Schema cho form Bệnh hại (lưu local, chờ API)
export const diseaseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Tên bệnh là bắt buộc'),
  symptoms: z.string().min(1, 'Triệu chứng là bắt buộc'),
  images: z.array(z.string()).optional(),
  treatment: z.string().min(1, 'Cách xử lý là bắt buộc'),
  severityLevel: z.string().default('LOW'),
});

// Schema cho form Tạo Cây trồng — Đồng bộ payload với POST /api/v1/crop
export const createCropSchema = z.object({
  name: z.string().min(1, 'Tên cây là bắt buộc'),
  cropTypeId: z.string().min(1, 'Vui lòng chọn loại cây trồng'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  // Các trường mở rộng (chờ API từ BE, không gửi lên server lúc này)
  stages: z.array(growthStageSchema).default([]).optional(),
  soil: soilConditionSchema.optional(),
  diseases: z.array(diseaseSchema).optional(),
});

export type CreateCropFormInput = z.infer<typeof createCropSchema>;
export type CreateCropTypeInput = z.infer<typeof createCropTypeSchema>;
