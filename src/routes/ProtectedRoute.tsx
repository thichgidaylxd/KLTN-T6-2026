import React from "react";
import { Navigate } from "react-router-dom";
import { hasRole } from "../utils/auth";
import { useAuth } from "../hooks/auth/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { accessToken, isAuthenticated } = useAuth();

  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(accessToken, requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
