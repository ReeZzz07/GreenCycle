import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader, Center } from '@mantine/core';
import { useAuthContext } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({
  children,
  requiredRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthContext();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" color="greenCycle" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role.name)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}