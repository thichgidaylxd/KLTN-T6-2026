import React from 'react';
import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/auth/useAuth';

export const PublicRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();
  const isForced = searchParams.get('force') === 'true';

  // If already authenticated and not forced, redirect to appropriate dashboard
  if (isAuthenticated && !isForced && user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'employee') {
      return <Navigate to="/task" replace />;
    }
    return <Navigate to="/farms" replace />;
  }

  // Otherwise, allow the user to see the public page (Login/Register)
  return <Outlet />;
};