import { useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { 
  logout, 
  loginSuccess, 
  selectFarm, 
  clearFarmContext, 
  refreshSubscription 
} from '../../store/authSlice';
import { getUserFromToken } from '../../utils/jwt';
import { authService } from '../../services/auth/authService';
import { LoginRequest as LoginInput, RegisterInput } from '../../types/auth';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const auth = useSelector((state: RootState) => state.auth);
  
  const user = useMemo(() => {
    if (!auth.accessToken) return null;
    
    // 1. Lấy thông tin cơ bản (Tên, Email) từ hubToken - Luôn chứa identity chính xác
    const identityUser = auth.hubToken ? getUserFromToken(auth.hubToken) : null;
    
    // 2. Lấy thông tin vai trò (Role) từ accessToken hiện tại - Phản ánh quyền hạn trong Farm
    const contextUser = getUserFromToken(auth.accessToken);
    
    if (!contextUser) return null;

    return {
      ...(identityUser || {}), // Giữ id, email, fullName từ hubToken
      ...contextUser,           // Cập nhật role từ farmToken
      fullName: identityUser?.fullName || contextUser?.fullName // Ưu tiên tên từ hubToken
    };
  }, [auth.accessToken, auth.hubToken]);

  return {
    isAuthenticated: auth.isAuthenticated,
    accessToken: auth.accessToken,
    hubToken: auth.hubToken,
    user,
    currentFarmId: auth.currentFarmId,
    
    // Actions
    logout: useCallback(() => dispatch(logout()), [dispatch]),
    selectFarm: useCallback((token: string, farmId: string) => 
      dispatch(selectFarm({ token, currentFarmId: farmId })), [dispatch]),
    clearFarmContext: useCallback(() => dispatch(clearFarmContext()), [dispatch]),
    refreshSubscription: useCallback(() => dispatch(refreshSubscription()), [dispatch]),
    
    // API wrappers
    login: useCallback(async (data: LoginInput) => {
      const res = await authService.login(data);
      if (res.success && res.data) {
        dispatch(loginSuccess(res.data));
      } else {
        throw new Error(res.message || 'Lỗi đăng nhập');
      }
      return res.data;
    }, [dispatch]),
    
    register: useCallback(async (data: RegisterInput) => {
      const res = await authService.register(data);
      if (!res.success) {
        throw new Error(res.message || 'Lỗi đăng ký');
      }
      return res.data;
    }, []),
  };
};
