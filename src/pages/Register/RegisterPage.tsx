import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';

import { Input } from '../../components/ui/input';
import { useRegister } from '../../hooks/register/useRegister';
import LoginBg from '@/assets/Login-Background.png';
import LogoBrowser from '@/assets/Logo-browser.png';

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    form: {
      register,
      formState: { errors, isSubmitting },
      getValues,
    },
    serverError,
    isSuccess,
    onSubmit,
  } = useRegister();

  useEffect(() => {
    if (!isSuccess) return;
    const timer = setTimeout(() => {
      const email = getValues('email');
      const password = getValues('password');
      navigate('/verify-email', { state: { email, password } });
    }, 2000);
    return () => clearTimeout(timer);
  }, [isSuccess, navigate, getValues]);

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden">
      {/* Left Section */}
      <div className="w-full lg:w-1/2 h-full flex flex-col overflow-hidden bg-white">
        {/* Logo - Top left inside flow */}
        <div className="flex-shrink-0 px-6 pt-4 md:px-8 md:pt-6">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-2 py-1.5 rounded-lg cursor-pointer hover:scale-105 transition-transform duration-300 shadow-sm border border-gray-100"
          >
            <img
              src={LogoBrowser}
              alt="FarmerAI logo"
              className="h-7 md:h-8 object-contain"
            />
            <span className="font-prompt font-extrabold text-[28px] leading-none bg-gradient-to-r from-emerald-800 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">
              farmarAI
            </span>
          </button>
        </div>

        {/* Form container - Compact and Centered */}
        <div className="flex-1 flex items-center justify-center px-6 py-2 md:px-10 overflow-hidden">
          <div className="w-full max-w-[400px] z-10">
            <div className="w-full rounded-xl bg-white p-5 shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]">
              {isSuccess ? (
                <div className="space-y-4">
                  <div className="mb-4 text-center">
                    <h1 className="mb-1 text-2xl font-extrabold text-gray-800">Chúc mừng!</h1>
                    <p className="text-sm text-gray-500">Tài khoản của bạn đã được tạo</p>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                    <div className="flex flex-col items-center text-center gap-4">
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                      <div className="flex-1">
                        <div className="mb-1 font-bold text-green-800 text-lg">Đăng ký thành công!</div>
                        <div className="mb-3 text-sm text-green-700">
                          Đang chuyển hướng...
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                          <span className="text-sm text-green-700 font-medium">Vui lòng chờ...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <h1 className="mb-0.5 text-xl font-extrabold text-gray-800">Bắt đầu ngay</h1>
                    <p className="text-gray-500 text-xs">Tạo tài khoản để quản lý trang trại của bạn</p>
                  </div>

                  <form onSubmit={onSubmit} className="space-y-2.5">
                    {serverError && (
                      <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 h-10 overflow-hidden">
                        <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                        <div className="text-[12px] font-semibold text-red-800 leading-tight">{serverError}</div>
                      </div>
                    )}

                    {/* Họ và tên */}
                    <div className="space-y-1">
                      <label htmlFor="fullName" className="block text-[12px] font-semibold text-gray-800">
                        Họ và tên <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Nguyễn Văn A"
                        disabled={isSubmitting}
                        {...register('fullName')}
                        className="h-9 rounded-lg border-gray-200 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                      />
                      <div className="h-3.5">
                        {errors.fullName && <span className="text-[11px] text-red-500 block leading-none">{errors.fullName.message}</span>}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label htmlFor="email" className="block text-[12px] font-semibold text-gray-800">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="email@example.com"
                        disabled={isSubmitting}
                        {...register('email')}
                        className="h-9 rounded-lg border-gray-200 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                      />
                      <div className="h-3.5">
                        {errors.email && <span className="text-[11px] text-red-500 block leading-none">{errors.email.message}</span>}
                      </div>
                    </div>

                    {/* Mật khẩu */}
                    <div className="space-y-1">
                      <label htmlFor="password" className="block text-[12px] font-semibold text-gray-800">
                        Mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          disabled={isSubmitting}
                          {...register('password')}
                          className="h-9 rounded-lg border-gray-200 pr-10 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500"
                          tabIndex={-1}
                        >
                          {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="h-3.5">
                        {errors.password ? (
                          <span className="text-[11px] text-red-500 block leading-none">{errors.password.message}</span>
                        ) : (
                          <span className="text-[10px] text-gray-500 block leading-none">≥ 8 ký tự, có chữ hoa và số</span>
                        )}
                      </div>
                    </div>

                    {/* Xác nhận mật khẩu */}
                    <div className="space-y-1">
                      <label htmlFor="confirmPassword" className="block text-[12px] font-semibold text-gray-800">
                        Xác nhận mật khẩu <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          disabled={isSubmitting}
                          {...register('confirmPassword')}
                          className="h-9 rounded-lg border-gray-200 pr-10 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="h-3.5">
                        {errors.confirmPassword && (
                          <span className="text-[11px] text-red-500 block leading-none">{errors.confirmPassword.message}</span>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-1.5">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-10 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 font-bold text-sm text-white hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Đang đăng ký...</span>
                          </>
                        ) : (
                          'Đăng ký'
                        )}
                      </button>
                    </div>

                    <div className="pt-2 text-center text-[13px] text-gray-500">
                      Đã có tài khoản?{' '}
                      <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="font-bold text-emerald-600 hover:text-emerald-700 underline-offset-4 hover:underline"
                      >
                        Đăng nhập
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="relative hidden w-1/2 lg:block h-full bg-white">
        <img
          src={LoginBg}
          alt="Background"
          className="h-full w-full object-cover shadow-2xl rounded-l-[40px]"
        />
      </div>
    </div>
  );
}

export default RegisterPage;