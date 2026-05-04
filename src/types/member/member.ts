export type MemberRole = 'owner' | 'manager' | 'worker' | 'employee';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';

export interface FarmRole {
  id: string;
  name: string;
  description: string;
}

export interface Member {
  userId: string;
  fullName: string;
  email: string;
  role: FarmRole;
  isActive: boolean;
  joinedAt: string;
  avatarUrl?: string | null;
}

export interface Invitation {
  id: string;
  email: string;
  role: FarmRole;
  status: InvitationStatus;
  expiresAt: string;
  farm: { id: string; name: string };
  inviter: { id: string; fullName: string; email: string };
}

export interface InvitationPreview {
  farmName: string;
  inviterName: string;
  role: string;
  email: string;
  expiresAt: string;
}

export interface InviteMemberRequest {
  email: string;
  roleId: string;
}

export interface ChangeRoleRequest {
  roleId: string;
}
