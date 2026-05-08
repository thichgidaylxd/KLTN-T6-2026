import { axiosInstance } from '../../config/axios';
import type {
  FarmMember,
  FarmInvitation,
  InvitationPreview,
  AcceptInvitationResponse,
  SendInvitationRequest,
  FarmRole,
} from '../../types/farm/farm';
import {
  getFarmMembersResponseSchema,
  getFarmInvitationsResponseSchema,
  getInvitationPreviewResponseSchema,
  getMyInvitationsResponseSchema,
  acceptInvitationApiResponseSchema,
  cancelInvitationResponseSchema,
  getFarmRolesResponseSchema,
  deleteFarmMemberResponseSchema,
  sendInvitationRequestSchema,
  sendInvitationResponseSchema,
} from '../../schemas/farmSchemas';

// ── Farm Invitation & Member Service ──
export const farmInvitationService = {
  // POST /api/v1/invitations/{invitationId}/accept
  async acceptInvitation(invitationId: string): Promise<AcceptInvitationResponse> {
    const response = await axiosInstance.post(`/api/v1/invitations/${invitationId}/accept`);
    const validated = acceptInvitationApiResponseSchema.parse(response.data);
    return validated.data;
  },

  // GET /api/v1/farms/{farmId}/members
  async getFarmMembers(farmId: string): Promise<FarmMember[]> {
    const response = await axiosInstance.get(`/api/v1/farms/${farmId}/members`);
    const validated = getFarmMembersResponseSchema.parse(response.data);
    return validated.data;
  },

  // POST /api/v1/farms/{farmId}/members (send invitation)
  async sendInvitation(farmId: string, data: SendInvitationRequest): Promise<string> {
    const payload = sendInvitationRequestSchema.parse(data);
    const response = await axiosInstance.post(`/api/v1/farms/${farmId}/members`, payload);
    const validated = sendInvitationResponseSchema.parse(response.data);
    return validated.data;
  },

  // PATCH /api/v1/farms/{farmId}/invitations/{invitationId}/cancel
  async cancelInvitation(farmId: string, invitationId: string): Promise<string> {
    const response = await axiosInstance.patch(
      `/api/v1/farms/${farmId}/invitations/${invitationId}/cancel`
    );
    const validated = cancelInvitationResponseSchema.parse(response.data);
    return validated.data;
  },

  // GET /api/v1/invitations/{invitationId}/preview
  async getInvitationPreview(invitationId: string): Promise<InvitationPreview> {
    const response = await axiosInstance.get(`/api/v1/invitations/${invitationId}/preview`);
    const validated = getInvitationPreviewResponseSchema.parse(response.data);
    return validated.data;
  },

  // GET /api/v1/invitations/me
  async getMyInvitations(status?: string): Promise<FarmInvitation[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const response = await axiosInstance.get('/api/v1/invitations/me', { params });
    const validated = getMyInvitationsResponseSchema.parse(response.data);
    return validated.data;
  },

  // GET /api/v1/farms/{farmId}/invitations
  async getFarmInvitations(farmId: string, status?: string): Promise<FarmInvitation[]> {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    const response = await axiosInstance.get(`/api/v1/farms/${farmId}/invitations`, { params });
    const validated = getFarmInvitationsResponseSchema.parse(response.data);
    return validated.data;
  },

  // GET /api/v1/farms/{farmId}/invitations/{invitationId}
  async getInvitationDetail(farmId: string, invitationId: string): Promise<string> {
    const response = await axiosInstance.get(
      `/api/v1/farms/${farmId}/invitations/${invitationId}`
    );
    const validated = deleteFarmMemberResponseSchema.parse(response.data); // Reuse string response schema
    return validated.data;
  },

  // GET /api/v1/farms/roles
  async getFarmRoles(): Promise<FarmRole[]> {
    const response = await axiosInstance.get('/api/v1/farms/roles');
    const validated = getFarmRolesResponseSchema.parse(response.data);
    return validated.data;
  },

  // DELETE /api/v1/farms/{farmId}/members/{memberId}
  async deleteFarmMember(farmId: string, memberId: string): Promise<string> {
    const response = await axiosInstance.delete(
      `/api/v1/farms/${farmId}/members/${memberId}`
    );
    const validated = deleteFarmMemberResponseSchema.parse(response.data);
    return validated.data;
  },
};
