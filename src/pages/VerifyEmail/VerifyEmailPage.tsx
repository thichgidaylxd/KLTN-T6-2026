import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { authService } from '../../services/auth/authService';

export const VerifyEmailPage: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const locationEmail = (location.state as { email?: string; password?: string } | null)?.email ?? '';
  const locationPassword = (location.state as { email?: string; password?: string } | null)?.password ?? '';
  const [resendEmail, setResendEmail] = useState(locationEmail || searchParams.get('email') || '');
  const [resendPassword, setResendPassword] = useState(locationPassword);
  const [status, setStatus] = useState<'info' | 'loading' | 'success' | 'error'>(
    token ? 'loading' : 'info'
  );
  const [message, setMessage] = useState(
    token ? 'Đang xác thực email của bạn...' : 'Chúng tôi đã gửi một liên kết xác thực đến email của bạn.'
  );
  const [resendLoading, setResendLoading] = useState(false);
  const [resendFeedback, setResendFeedback] = useState('');

  const handleResendVerification = async () => {
    if (!resendEmail.trim()) {
      setResendFeedback('Không tìm thấy email đăng ký để gửi lại mã xác thực.');
      return;
    }
    if (!resendPassword.trim()) {
      setResendFeedback('Vui lòng nhập mật khẩu để gửi lại email xác thực.');
      return;
    }

    try {
      setResendLoading(true);
      setResendFeedback('');
      const response = await authService.resendRegisterMail({
        email: resendEmail.trim(),
        password: resendPassword.trim(),
      });
      if (response.success) {
        setResendFeedback('Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư của bạn.');
      } else {
        setResendFeedback(response.message || 'Không thể gửi lại email xác thực.');
      }
    } catch (error: any) {
      setResendFeedback(error?.response?.data?.message || error?.message || 'Không thể gửi lại email xác thực.');
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) return;

      try {
        const response = await authService.verify({ token });
        if (response.success) {
          setStatus('success');
          setMessage(
            'Xác thực email thành công! Tài khoản của bạn đã được kích hoạt.'
          );
        } else {
          setStatus('error');
          setMessage(
            response.message ||
            'Xác thực thất bại. Liên kết có thể đã hết hạn.'
          );
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(
          error.response?.data?.message ||
          'Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại sau.'
        );
      }
    };
    verifyEmail();
  }, [token]);
  return (
    <AuthLayout title="Xác thực Email">
      <div className="text-center py-4">
        {status === 'info' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
              <Mail className="w-10 h-10 text-emerald-600" />
            </div>
            <p className="text-gray-800 font-medium text-lg">Kiểm tra hòm thư của bạn</p>
            <p className="text-gray-600 max-w-xs mx-auto">
              {message} Vui lòng nhấn vào liên kết trong email để hoàn tất đăng ký.
            </p>
            <div className="flex flex-col w-full space-y-3 mt-4">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Nhập email để gửi lại xác thực"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <input
                type="password"
                value={resendPassword}
                onChange={(e) => setResendPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                className="w-full inline-flex justify-center py-2 px-4 border border-emerald-600 rounded-md shadow-sm text-sm font-medium text-emerald-600 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
              >
                {resendLoading ? 'Đang gửi...' : 'Gửi lại email xác thực'}
              </button>
              {resendFeedback && <p className="text-xs text-gray-600">{resendFeedback}</p>}
              <Link
                to="/login"
                className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
              >
                Quay lại trang đăng nhập
              </Link>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <p className="text-gray-600 font-medium">{message}</p>
          </div>
        )}

        {status === 'success' &&
        <div className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500" />
            <p className="text-gray-800 font-medium">{message}</p>
            <Link
            to="/login"
            className="mt-4 w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors">
            
              Đến trang đăng nhập
            </Link>
          </div>
        }

        {status === 'error' &&
        <div className="flex flex-col items-center justify-center space-y-4">
            <XCircle className="w-16 h-16 text-red-500" />
            <p className="text-red-600 font-medium">{message}</p>
            <div className="flex flex-col w-full space-y-3 mt-4">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Nhập email để gửi lại xác thực"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <input
                type="password"
                value={resendPassword}
                onChange={(e) => setResendPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <button
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="w-full inline-flex justify-center py-2 px-4 border border-emerald-600 rounded-md shadow-sm text-sm font-medium text-emerald-600 bg-white hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors">
              
                {resendLoading ? 'Đang gửi...' : 'Gửi lại email xác thực'}
              </button>
              {resendFeedback && <p className="text-xs text-gray-600">{resendFeedback}</p>}
              <Link
              to="/login"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-500">
              
                Quay lại trang đăng nhập
              </Link>
            </div>
          </div>
        }
      </div>
    </AuthLayout>);

};