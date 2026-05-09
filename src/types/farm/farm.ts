export interface Farm {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateFarmRequest {
  farmName: string;
  description: string;
}

export interface FarmResponse {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface FarmSummary {
  farmId: string;
  farmName: string;
  description: string;
  ownerId: string;
  ownerFullName: string;
  ownerAvatarUrl: string;
  myRole: string;
  owner: boolean;
}

export interface UpdateFarmRequest {
  name: string;
  description: string;
  version?: number;
}

// Select Farm Response
export interface SelectFarmResponseData {
  farmToken: string;
}

// ── Farm Invitation & Member types ──
export interface FarmRole {
  id: string;
  name: string;
  description?: string | null;
}

export interface FarmMember {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role: FarmRole;
  isActive: boolean;
  joinedAt: string;
}

export interface FarmInvitation {
  id: string;
  email: string;
  farm: {
    id: string;
    name: string;
  };
  role: FarmRole;
  status: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  inviter: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  expiresAt: string;
}

export interface InvitationPreview {
  farmName: string;
  inviterName: string;
  role: string;
  email: string;
  expiresAt: string;
}

export interface AcceptInvitationResponse {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role: FarmRole;
  isActive: boolean;
  joinedAt: string;
}

export interface SendInvitationRequest {
  email: string;
  roleId: string;
}

export interface CancelInvitationRequest {
  // empty body — nhưng vẫn có thể gửi rỗng
}

