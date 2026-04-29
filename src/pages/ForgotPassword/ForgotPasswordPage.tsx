import React from 'react';
import { AuthLayout } from '../../layouts/AuthLayout';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
export const ForgotPasswordPage: React.FC = () => {
  return (
    <AuthLayout
      title="Quên mật khẩu?"
      subtitle="Nhập email của bạn để nhận liên kết đặt lại mật khẩu">
      
      <ForgotPasswordForm />
    </AuthLayout>);

};