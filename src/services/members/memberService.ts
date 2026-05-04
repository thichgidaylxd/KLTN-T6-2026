import { axiosInstance } from '../../config/axios';
import { ApiResponse } from '../../types/auth';
import {
  Member,
  Invitation,
  InvitationPreview,
  InviteMemberRequest,
  ChangeRoleRequest,
  FarmRole
} from '../../types/member';

// memberService.ts
export const memberService = {
  async getMembers(farmId: string): Promise<ApiResponse<Member[]>> {
    const res = await axiosInstance.get(`/api/v1/farms/${farmId}/members`);
    return res.data;
  },

  async inviteMember(farmId: string, data: InviteMemberRequest): Promise<ApiResponse<null>> {
    const res = await axiosInstance.post(`/api/v1/farms/${farmId}/members`, data);
    return res.data;
  },

  async cancelInvitation(farmId: string, invitationId: string): Promise<ApiResponse<null>> {
    const res = await axiosInstance.patch(`/api/v1/farms/${farmId}/invitations/${invitationId}/cancel`);
    return res.data;
  },

  async removeMember(farmId: string, memberId: string): Promise<ApiResponse<null>> {
    const res = await axiosInstance.delete(`/api/v1/farms/${farmId}/members/${memberId}`);
    return res.data;
  },

  async changeRole(farmId: string, memberId: string, _data: ChangeRoleRequest): Promise<ApiResponse<null>> {
    throw new Error(
      `changeRole is not available in current API spec (farmId=${farmId}, memberId=${memberId}).`
    );
  },

  async getInvitations(farmId: string, status?: string): Promise<ApiResponse<Invitation[]>> {
    const res = await axiosInstance.get(`/api/v1/farms/${farmId}/invitations`, {
      params: status ? { status } : undefined
    });
    return res.data;
  },

  async getFarmRoles(): Promise<ApiResponse<FarmRole[]>> {
    const res = await axiosInstance.get('/api/v1/farms/roles')
    return res.data
  },

  async previewInvitation(invitationId: string): Promise<ApiResponse<InvitationPreview>> {
    const res = await axiosInstance.get(`/api/v1/invitations/${invitationId}/preview`);
    return res.data;
  },

  async acceptInvitation(invitationId: string): Promise<ApiResponse<Member>> {
    const res = await axiosInstance.post(`/api/v1/invitations/${invitationId}/accept`);
    return res.data;
  },

  async getMyInvitations(status?: string): Promise<ApiResponse<Invitation[]>> {
    const res = await axiosInstance.get('/api/v1/invitations/me', {
      params: status ? { status } : undefined,
    });
    return res.data;
  },
};
