export type UserStatus = 'PENDING' | 'ACTIVE' | 'DELETED' | 'LOCKED';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: UserStatus;
  isLocked: boolean;
  createdAt: string;
}
