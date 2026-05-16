import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../store/AuthContext';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}
