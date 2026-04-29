import React from 'react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
export const ResetPasswordPage: React.FC = () => {
  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Vui lòng nhập mật khẩu mới cho tài khoản của bạn">
      
      <ResetPasswordForm />
    </AuthLayout>);

};