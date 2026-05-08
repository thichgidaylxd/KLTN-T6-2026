import { z } from 'zod';
import { apiResponseSchema } from './seasonPlanSchemas';

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

// ── Shared sub-schemas ──
export const userObjectSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  status: z.string(),
  isLocked: z.boolean(),
  createdAt: z.string(),
});

export const farmRoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
});

// ── Farm Member ──
export const farmMemberSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().nullable().optional(),
  role: farmRoleSchema,
  isActive: z.boolean(),
  joinedAt: z.string(),
});

export const getFarmMembersResponseSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
  data: z.array(farmMemberSchema),
  timestamp: z.string(),
});

// ── Farm Invitation ──
export const farmInvitationSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  farm: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
  role: farmRoleSchema,
  status: z.enum(['PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED']),
  inviter: z.object({
    id: z.string().uuid(),
    fullName: z.string(),
    email: z.string().email(),
  }),
  createdAt: z.string(),
  expiresAt: z.string(),
});

export const invitationPreviewSchema = z.object({
  farmName: z.string(),
  inviterName: z.string(),
  role: z.string(),
  email: z.string().email(),
  expiresAt: z.string(),
});

export const acceptInvitationResponseSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().nullable().optional(),
  role: farmRoleSchema,
  isActive: z.boolean(),
  joinedAt: z.string(),
});

export const sendInvitationRequestSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  roleId: z.string().uuid('Vui lòng chọn vai trò'),
});

export const sendInvitationResponseSchema = apiResponseSchema(z.string());

// ── Response wrappers ──
export const getFarmInvitationsResponseSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
  data: z.array(farmInvitationSchema),
  timestamp: z.string(),
});

export const getInvitationPreviewResponseSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
  data: invitationPreviewSchema,
  timestamp: z.string(),
});

export const getMyInvitationsResponseSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
  data: z.array(farmInvitationSchema),
  timestamp: z.string(),
});

export const acceptInvitationApiResponseSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
  data: acceptInvitationResponseSchema,
  timestamp: z.string(),
});

export const cancelInvitationResponseSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
  data: z.string(),
  timestamp: z.string(),
});

export const getFarmRolesResponseSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
  data: z.array(farmRoleSchema),
  timestamp: z.string(),
});

export const deleteFarmMemberResponseSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
  data: z.string(),
  timestamp: z.string(),
});
