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
  address: z.string().min(1, "Địa chỉ không được để trống"),
  latitude: z
    .number({ invalid_type_error: "Vui lòng click chọn vị trí trên bản đồ" })
    .min(-90).max(90),
  longitude: z
    .number({ invalid_type_error: "Vui lòng click chọn vị trí trên bản đồ" })
    .min(-180).max(180),
});

export const getWarehousesResponseSchema = apiResponseSchema(z.array(warehouseSchema));

export type CreateWarehouseFormValues = z.infer<typeof createWarehouseSchema>;
