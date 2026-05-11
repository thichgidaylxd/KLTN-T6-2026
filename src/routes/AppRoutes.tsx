import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicRoutes } from './PublicRoutes';
import { PrivateRoutes } from './PrivateRoutes';
import { LoadingPage } from '../components/ui/LoadingPage';
import ProtectedRoute from './ProtectedRoute';
import { ConfigPage } from '@/pages/Config/ConfigPage';
const AcceptInvitationPage = lazy(() =>
  import('../pages/Invitation/AcceptInvitationPage').then(module => ({
    default: module.AcceptInvitationPage,
  }))
)
// Pages
const HomePage = lazy(() => import('../pages/landing/HomePage'));
const LoginPage = lazy(() => import('../pages/Login/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('../pages/Register/RegisterPage').then(module => ({ default: module.RegisterPage })));
const VerifyEmailPage = lazy(() => import('../pages/VerifyEmail/VerifyEmailPage').then(module => ({ default: module.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPassword/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('../pages/ResetPassword/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage })));
const ChangePasswordPage = lazy(() => import('../pages/ChangePassword/ChangePasswordPage').then(module => ({ default: module.ChangePasswordPage })));
const MainPage = lazy(() => import('../pages/Dashboard/MainPage'));
const UnauthorizedPage = lazy(() => import('../pages/landing/UnauthorizedPage').then(module => ({ default: module.UnauthorizedPage })));
const SubscriptionHistoryPage = lazy(() => import('../pages/Subscription/SubscriptionHistoryPage'));
const MembersPage = lazy(() => import('../pages/members/MembersPage').then(module => ({ default: module.MembersPage })));
const InviteExpiredPage = lazy(() => import('../pages/invite-expired/InviteExpiredPage').then(module => ({ default: module.InviteExpiredPage })));
const LandPlotsPage = lazy(() => import('../pages/LandPlots/LandPlotsPage').then(module => ({ default: module.LandPlotsPage })));
const MapPage = lazy(() => import('../pages/Map/MapPage').then(module => ({ default: module.MapPage })));
const ManagementDashboardPage = lazy(() => import('../pages/FarmManagement/ManagementDashboard').then(module => ({ default: module.ManagementDashboardPage })));
const WalletPage = lazy(() => import('../pages/Wallet/WalletPage'));
const ActivityPage = lazy(() => import('../pages/Activity/ActivityPage'));
const TasksPage = lazy(() => import('../pages/Tasks/TasksPage'));
const GeminiPage = lazy(() => import('../pages/Gemini/GeminiPage'));
const SubscriptionPage = lazy(() => import('../pages/Pricing/SubscriptionPage'));
const PaymentResultPage = lazy(() => import('../pages/Pricing/PaymentResultPage'));
const FarmActionsPage = lazy(() => import('../pages/FarmManagement/FarmActionsPage'));
const CropCatalogPage = lazy(() => import('../pages/CropCatalog/CropCatalogPage'));
const SeasonPlanPage = lazy(() => import('../pages/SeasonPlan/SeasonPlanPage'));
const SeasonPlanListPage = lazy(() => import('../pages/SeasonPlan/SeasonPlanListPage'));
const AdminDashboardPage = lazy(() => import('../pages/Admin/AdminDashboardPage'));
const WarehousePage = lazy(() => import('../pages/Warehouse/WarehousePage').then(module => ({ default: module.WarehousePage })));
const WarehouseDetailPage = lazy(() => import('../pages/Warehouse/WarehouseDetailPage').then(module => ({ default: module.WarehouseDetailPage })));
const SupplierListPage = lazy(() => import('../pages/Supplier/SupplierListPage').then(module => ({ default: module.SupplierListPage })));
const SKUListPage = lazy(() => import('../pages/SKU/SKUListPage').then(module => ({ default: module.SKUListPage })));
const FarmTransactionPage = lazy(() => import('../pages/Warehouse/FarmTransactionPage').then(module => ({ default: module.FarmTransactionPage })));
const UserManagementPage = lazy(() => import('../pages/Admin/UserManagementPage'));

// Layouts
const DashboardLayout = lazy(() => import('../layouts/DashboardLayout'));
const AdminLayout = lazy(() => import('../layouts/AdminLayout'));

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Landing Page */}
      <Route path="/" element={<Suspense fallback={<LoadingPage />}><HomePage /></Suspense>} />

      {/* Public Routes */}
      <Route element={<PublicRoutes />}>
        <Route path="/login" element={<Suspense fallback={<LoadingPage />}><LoginPage /></Suspense>} />
        <Route path="/register" element={<Suspense fallback={<LoadingPage />}><RegisterPage /></Suspense>} />
        <Route path="/forgot-password" element={<Suspense fallback={<LoadingPage />}><ForgotPasswordPage /></Suspense>} />
        <Route path="/reset-password" element={<Suspense fallback={<LoadingPage />}><ResetPasswordPage /></Suspense>} />
        <Route path="/verify-email" element={<Suspense fallback={<LoadingPage />}><VerifyEmailPage /></Suspense>} />
        <Route path="/invite/expired" element={<Suspense fallback={<LoadingPage />}><InviteExpiredPage /></Suspense>} />
        <Route path="/invitations/:invitationId/accept" element={<AcceptInvitationPage />} />
      </Route>

      {/* Private Routes */}
      <Route element={<PrivateRoutes />}>
        <Route element={<Suspense fallback={<LoadingPage />}><DashboardLayout /></Suspense>}>
          <Route path="/dashboard" element={<Suspense fallback={<LoadingPage />}><MainPage /></Suspense>} />
          <Route path="/change-password" element={<Suspense fallback={<LoadingPage />}><ChangePasswordPage /></Suspense>} />

          {/* Global routes */}
          <Route path="/wallet" element={<Suspense fallback={<LoadingPage />}><WalletPage /></Suspense>} />
          <Route path="/activity" element={<Suspense fallback={<LoadingPage />}><ActivityPage /></Suspense>} />
          <Route path="/task" element={<Suspense fallback={<LoadingPage />}><TasksPage /></Suspense>} />
          <Route path="/gemini" element={<Suspense fallback={<LoadingPage />}><GeminiPage /></Suspense>} />
          <Route path="/config" element={<Suspense fallback={<LoadingPage />}><ConfigPage /></Suspense>} />
          <Route path="/subscription/pricing" element={<Suspense fallback={<LoadingPage />}><SubscriptionPage /></Suspense>} />

          {/* Farm selection — no farmId */}
          <Route path="/farms" element={<Suspense fallback={<LoadingPage />}><ManagementDashboardPage /></Suspense>} />

          {/* Farm-specific routes — require farmId in URL */}
          <Route path="/farms/:farmId">
            <Route path="actions" element={<Suspense fallback={<LoadingPage />}><FarmActionsPage /></Suspense>} />
            <Route path="wallet" element={<Suspense fallback={<LoadingPage />}><WalletPage /></Suspense>} />
            <Route path="activity" element={<Suspense fallback={<LoadingPage />}><ActivityPage /></Suspense>} />
            <Route path="metrics" element={<Suspense fallback={<LoadingPage />}><ActivityPage /></Suspense>} />
            <Route path="task" element={<Suspense fallback={<LoadingPage />}><TasksPage /></Suspense>} />
            <Route path="season-plans" element={<Suspense fallback={<LoadingPage />}><SeasonPlanListPage /></Suspense>} />
            <Route path="season-plans/:planId" element={<Suspense fallback={<LoadingPage />}><SeasonPlanPage /></Suspense>} />
            <Route path="map" element={<Suspense fallback={<LoadingPage />}><MapPage /></Suspense>} />
            <Route path="land-plots" element={<Suspense fallback={<LoadingPage />}><LandPlotsPage /></Suspense>} />
            <Route path="members" element={<Suspense fallback={<LoadingPage />}><MembersPage /></Suspense>} />
            <Route path="subscription" element={<Navigate to="subscription/history" replace />} />
            <Route path="subscription/history" element={<Suspense fallback={<LoadingPage />}><SubscriptionHistoryPage /></Suspense>} />
            <Route path="subscription/pricing" element={<Suspense fallback={<LoadingPage />}><SubscriptionPage /></Suspense>} />
            <Route path="gemini" element={<Suspense fallback={<LoadingPage />}><GeminiPage /></Suspense>} />
            <Route path="crop-catalog" element={<Suspense fallback={<LoadingPage />}><CropCatalogPage /></Suspense>} />
            <Route path="warehouses" element={<Suspense fallback={<LoadingPage />}><WarehousePage /></Suspense>} />
            <Route path="warehouses/:warehouseId" element={<Suspense fallback={<LoadingPage />}><WarehouseDetailPage /></Suspense>} />
            <Route path="transactions" element={<Suspense fallback={<LoadingPage />}><FarmTransactionPage /></Suspense>} />
            <Route path="suppliers" element={<Suspense fallback={<LoadingPage />}><SupplierListPage /></Suspense>} />
            <Route path="skus" element={<Suspense fallback={<LoadingPage />}><SKUListPage /></Suspense>} />
          </Route>
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute requiredRole="ROLE_ADMIN"><Suspense fallback={<LoadingPage />}><AdminLayout /></Suspense></ProtectedRoute>}>
          <Route path="/admin/dashboard" element={<Suspense fallback={<LoadingPage />}><AdminDashboardPage /></Suspense>} />
          <Route path="/admin/crop-catalog" element={<Suspense fallback={<LoadingPage />}><CropCatalogPage /></Suspense>} />
          <Route path="/admin/users" element={<Suspense fallback={<LoadingPage />}><UserManagementPage /></Suspense>} />
        </Route>

        {/* Standalone payment result page */}
        <Route path="/payment-result" element={<Suspense fallback={<LoadingPage />}><PaymentResultPage /></Suspense>} />
      </Route>

      {/* Unauthorized Page */}
      <Route path="/unauthorized" element={<Suspense fallback={<LoadingPage />}><UnauthorizedPage /></Suspense>} />

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
