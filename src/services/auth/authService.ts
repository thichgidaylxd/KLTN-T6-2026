import { axiosInstance } from '../../config/axios';
import {
  ApiResponse,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  VerifyRequest
} from '../../types/auth';


export const authService = {
  async register(data: RegisterRequest): Promise<ApiResponse<string>> {
    const response = await axiosInstance.post<ApiResponse<string>>(
      '/api/v1/auth/register',
      data
    );
    return response.data;
  },

  async login(data: LoginRequest): Promise<ApiResponse<AuthTokens>> {
    const response = await axiosInstance.post<ApiResponse<AuthTokens>>(
      '/api/v1/auth/login',
      data
    );
    return response.data;
  },

  async verify(data: VerifyRequest): Promise<ApiResponse<string>> {
    const response = await axiosInstance.post<ApiResponse<string>>(
      '/api/v1/auth/verify',
      data
    );
    return response.data;
  },

  async refresh(refreshToken: string): Promise<ApiResponse<AuthTokens>> {
    const response = await axiosInstance.post<ApiResponse<AuthTokens>>(
      '/api/v1/auth/refresh',
      { refreshToken }
    );
    return response.data;
  },

  // ──────────────────────────────────────────────
  // [ĐANG CHỜ API]
  // Chưa xuất hiện trong tài liệu Backend mới nhất
  // ──────────────────────────────────────────────

  async forgotPassword(email: string): Promise<ApiResponse<string>> {
    throw new Error(
      `forgotPassword is not available in current API spec (email=${email}).`
    );
  },

  async resetPassword(_data: any): Promise<ApiResponse<string>> {
    throw new Error('resetPassword is not available in current API spec.');
  },

  async changePassword(_data: any): Promise<ApiResponse<string>> {
    throw new Error('changePassword is not available in current API spec.');
  }
};