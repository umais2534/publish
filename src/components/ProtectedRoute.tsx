// components/ProtectedRoute.tsx
import { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children?: ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (!isAuthenticated && !isLoading) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
}