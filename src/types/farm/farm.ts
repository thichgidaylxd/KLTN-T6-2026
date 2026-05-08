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
