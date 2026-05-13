import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSchema } from '../../schemas/authSchemas';
import { authService } from '../../services/auth/authService';
import { loginSuccess } from '../../store/authSlice';
import { LoginRequest as LoginInput } from '../../types/auth';
import { getRolesFromToken } from '../../utils/jwt';

export function useLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginInput & { rememberMe: boolean }>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    },
  });

  const onSubmit = form.handleSubmit(async (data: LoginInput & { rememberMe: boolean }) => {
    setServerError(null);
    try {
      const response = await authService.login(data);
      if (response.success && response.data.accessToken) {
        dispatch(loginSuccess({ ...response.data, rememberMe: data.rememberMe }));

        // Điều hướng sau login dựa trên role trích xuất từ token
        const roles = getRolesFromToken(response.data.accessToken);
        let redirectPath = '/farms';

        if (roles.includes('ROLE_ADMIN')) {
          redirectPath = '/admin/dashboard';
        } else if (roles.includes('ROLE_WORKER') || roles.includes('ROLE_EMPLOYEE')) {
          redirectPath = '/tasks';
        } else {
          redirectPath = '/farms';
        }

        // Luôn vào thẳng redirectPath (mặc định là /farms) theo yêu cầu
        navigate(redirectPath, { replace: true });
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
