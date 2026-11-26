import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageLoader } from '@/components/ui';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/features/auth/AuthContext';
import { getDashboardRouteForRole, type UserRole } from '@/types/auth';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  loginPath?: string;
}

export function ProtectedRoute({ allowedRoles, loginPath = ROUTES.LOGIN }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <PageLoader message="Verifying your Medexa session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  if (user.accountStatus === 'PENDING_APPROVAL') {
    return <Navigate to={ROUTES.PENDING_APPROVAL} replace state={{ role: user.role }} />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return <Outlet />;
}

export function GuestOnlyRoute() {
  const { isAuthenticated, isInitializing, user } = useAuth();

  if (isInitializing) {
    return <PageLoader message="Checking authentication status..." />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardRouteForRole(user.role)} replace />;
  }

  return <Outlet />;
}
