import { axiosInstance } from '../../config/axios';
import { ApiResponse } from '../../types/auth/auth';
import { User } from '../../types/user/user';

export const userService = {
  /**
   * GET /api/v1/users
   * Danh sách tất cả người dùng
   */
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    const response = await axiosInstance.get('/api/v1/users');
    return response.data;
  },

  /**
   * GET /api/v1/users/need-new-verification
   * Danh sách người dùng cần xác thực mới
   */
  async getUsersNeedVerification(): Promise<ApiResponse<User[]>> {
    const response = await axiosInstance.get('/api/v1/users/need-new-verification');
    return response.data;
  },

  /**
   * DELETE /api/v1/users/{userId}
   * Xóa người dùng
   */
  async deleteUser(userId: string): Promise<ApiResponse<string>> {
    const response = await axiosInstance.delete(`/api/v1/users/${userId}`);
    return response.data;
  },


  async getUserSummary(): Promise<ApiResponse<any>> {
    const response = await axiosInstance.get('/api/v1/users/summary');
    return response.data;
  },
};
