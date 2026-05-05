/**
 * Tiện ích quản lý vai trò trong hệ thống FarmerAI
 * Giúp đồng bộ hóa tên hiển thị tiếng Việt theo tài liệu nghiệp vụ
 */
import { RoleId } from '../types/auth';

export const ROLE_DISPLAY_NAMES: Record<RoleId, string> = {
  owner: 'Chủ trang trại',
  manager: 'Người quản lý trang trại',
  employee: 'Nhân công',
  user: 'Người dùng',
  admin: 'Quản trị viên',
};


export const getRoleDisplayName = (role: string | undefined): string => {
  if (!role) return 'Người dùng';

  const lower = role.toLowerCase();
  // API farm thường trả OWNER / MANAGER / WORKER (chữ hoa)
  const normalizedRole = lower === 'worker' ? 'employee' : lower;

  return ROLE_DISPLAY_NAMES[normalizedRole as RoleId] || role;
};
