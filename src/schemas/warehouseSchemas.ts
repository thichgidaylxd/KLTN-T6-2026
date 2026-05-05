import { z } from "zod";
import { apiResponseSchema } from "./seasonPlanSchemas";

export const warehouseSchema = z.object({
  id: z.string().uuid(),
  version: z.number().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export const createWarehouseSchema = z.object({
  name: z.string().min(1, "Tên kho không được để trống"),
  description: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number({ required_error: "Vui lòng chọn vị trí trên bản đồ" }),
  longitude: z.number({ required_error: "Vui lòng chọn vị trí trên bản đồ" }),
});

export const updateWarehouseSchema = z.object({
  name: z.string().min(1, "Tên kho không được để trống").optional(),
  description: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  version: z.number(), // Bắt buộc
});

export const getWarehousesResponseSchema = apiResponseSchema(z.array(warehouseSchema));
export const updateWarehouseResponseSchema = apiResponseSchema(warehouseSchema);

export type CreateWarehouseFormValues = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseFormValues = z.infer<typeof updateWarehouseSchema>;
