import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DonorDashboard } from './DonorDashboard';
import { ReceiverDashboard } from './ReceiverDashboard';
import { AdminDashboard } from './AdminDashboard';

export const DashboardDispatcher: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="py-24 text-center text-xs text-gray-400">
        Loading authenticated workspace...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') {
    return <AdminDashboard />;
  }

  if (user.role === 'RECEIVER') {
    return <ReceiverDashboard />;
  }

  return <DonorDashboard />;
};

