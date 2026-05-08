export interface ApiResponse<T> {
  success: boolean;
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface UserInfo {
  id?: string;
  email?: string;
  fullName?: string;
  role?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user?: UserInfo;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

export interface VerifyRequest {
  token: string;
}

export interface ResendRegisterMailRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export type RoleId = 'owner' | 'manager' | 'employee' | 'user' | 'admin';

export interface JwtPayload {
  sub: string; // user ID
  roles?: string[]; // Array of roles: ["ROLE_USER", "ROLE_OWNER", etc.]
  authorities?: string[]; // Array of strings (common in Spring Security)
  role?: string;         // Single role string
  farmRole?: string;     // Role trong farm (OWNER, MANAGER, EMPLOYEE) - trong farmToken
  fullName?: string; // Họ tên thực tế từ Backend
  name?: string;     // Tên dự phòng từ Backend
  email?: string;    // Email thực tế
  iat?: number;
  exp?: number;
  perms?: string[];       // Danh sách quyền (ví dụ: farm:update)
  permissions?: string[]; // Dự phòng cho trường hợp Backend dùng 'permissions'
  farmId?: string;   // Farm ID trong farmToken
}

export type LoginInput = LoginRequest;
export interface RegisterInput extends RegisterRequest {
  confirmPassword?: string;
}
export interface ForgotPasswordInput {
  email: string;
}
