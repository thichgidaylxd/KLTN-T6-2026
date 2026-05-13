import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../../hooks/login/useLogin';
import { useState } from 'react';
import LoginBg from '@/assets/Login-Background.png';
import LogoBrowser from '@/assets/Logo-browser.png';

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const {
    form: { register, formState: { errors, isSubmitting } },
    serverError,
    onSubmit,
  } = useLogin();

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white">
      {/* Left Section - Form */}
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

        {/* Login Card - Centered in remaining space */}
        <div className="flex-1 flex items-center justify-center px-6 py-3 md:px-10">
          <div className="w-full max-w-[380px] bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] p-5">
            {/* Header */}
            <div className="mb-4">
              <h1 className="text-xl font-extrabold text-gray-800 mb-0.5">Chào mừng trở lại!</h1>
              <p className="text-gray-500 text-xs">Đăng nhập để quản lý trang trại của bạn</p>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-3">
              {/* Server Error Alert */}
              <div className="h-10">
                {serverError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 flex gap-2 items-center shadow-sm">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                    <div className="text-red-900 text-[12px] font-semibold leading-tight">{serverError}</div>
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-1">
                <label htmlFor="email" className="block font-semibold text-gray-900 text-[12px]">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nhập email của bạn"
                  disabled={isSubmitting}
                  {...register('email')}
                  className="w-full h-9 text-sm border-gray-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
                <div className="h-3.5">
                  {errors.email && (
                    <span className="text-red-500 text-[11px] font-medium block">
                      {errors.email.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="font-semibold text-gray-900 text-[12px]">Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="bg-transparent border-none text-emerald-500 text-[11px] font-medium cursor-pointer p-0 transition-colors hover:text-emerald-600"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="nhập mật khẩu của bạn"
                    disabled={isSubmitting}
                    {...register('password')}
                    className="h-9 border-gray-200 pr-10 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-0.5 hover:text-emerald-500 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <div className="h-3.5">
                  {errors.password && (
                    <span className="text-red-500 text-[11px] font-medium block">
                      {errors.password.message}
                    </span>
                  )}
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-3.5 h-3.5 cursor-pointer accent-emerald-500"
                  {...register('rememberMe')}
                />
                <label htmlFor="remember" className="text-gray-600 text-[11px] cursor-pointer select-none font-medium">
                  Ghi nhớ đăng nhập
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none rounded-lg font-bold text-sm cursor-pointer transition-colors hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang đăng nhập...</span>
                    </div>
                  ) : (
                    'Đăng nhập'
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center py-1 gap-4">
                <div className="flex-1 h-px bg-gray-100" />
                <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">hoặc</div>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Sign Up Link */}
              <div className="text-center text-gray-500 text-xs">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="text-emerald-500 font-bold bg-transparent border-none cursor-pointer transition-colors hover:text-emerald-700 underline-offset-4 hover:underline"
                >
                  Đăng ký ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Section - Image with Rounded Corners */}
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

export default LoginPage;