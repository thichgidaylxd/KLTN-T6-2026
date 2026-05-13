import React from 'react';
import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/auth/useAuth';
import { getRolesFromToken } from '../utils/jwt';

export const PublicRoutes: React.FC = () => {
  const { isAuthenticated, accessToken } = useAuth();
  const [searchParams] = useSearchParams();
  const isForced = searchParams.get('force') === 'true';

  // If already authenticated and not forced, redirect to appropriate dashboard
  if (isAuthenticated && !isForced && accessToken) {
    const roles = getRolesFromToken(accessToken);
    if (roles.includes('ROLE_ADMIN')) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (roles.includes('ROLE_WORKER') || roles.includes('ROLE_EMPLOYEE')) {
      return <Navigate to="/tasks" replace />;
    }
    return <Navigate to="/farms" replace />;
  }

  // Otherwise, allow the user to see the public page (Login/Register)
  return <Outlet />;
};