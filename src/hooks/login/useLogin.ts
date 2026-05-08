import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSchema } from '../../schemas/authSchemas';
import { authService } from '../../services/auth/authService';
import { loginSuccess } from '../../store/authSlice';
import { LoginRequest as LoginInput } from '../../types/auth';

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = form.handleSubmit(async (data: LoginInput) => {
    setServerError(null);
    try {
      const response = await authService.login(data);
      if (response.success && response.data.accessToken) {
        dispatch(loginSuccess(response.data));
        
        // Điều hướng sau login dựa trên role (PB 02)
        const user = response.data.user;
        let redirectPath = '/dashboard';
        
        if (user) {
          const role = (user.role || '').toUpperCase();
          if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
            redirectPath = '/admin/dashboard';
          } else if (role === 'WORKER' || role === 'ROLE_WORKER' || role === 'EMPLOYEE') {
            redirectPath = '/tasks';
          } else {
            redirectPath = '/dashboard';
          }
        }

        let from = (location.state as any)?.from?.pathname || redirectPath;
        
        // Force Admin to their dashboard if they were redirected from farm dashboard
        if (user && (user.role === 'ADMIN' || user.role === 'ROLE_ADMIN') && from === '/dashboard') {
          from = '/admin/dashboard';
        }

        navigate(from, { replace: true });
      } else {
        setServerError('Sai tên đăng nhập hoặc mật khẩu');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        setServerError('Sai tên đăng nhập hoặc mật khẩu');
      } else {
        setServerError(error.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập');
      }
    }
  });

  return {
    form,
    serverError,
    onSubmit,
  };
}
