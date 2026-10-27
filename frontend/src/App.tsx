import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './layouts/AppLayout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardDispatcher } from './pages/DashboardDispatcher';
import { MarketplacePage } from './pages/MarketplacePage';
import { DonationDetailPage } from './pages/DonationDetailPage';
import { CreateDonationPage } from './pages/CreateDonationPage';
import { ForecastingPage } from './pages/ForecastingPage';
import { MatchingPage } from './pages/MatchingPage';
import { ImpactAnalyticsPage } from './pages/ImpactAnalyticsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="py-24 text-center text-xs text-gray-400">Verifying session...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            {/* Public Routes */}
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="marketplace" element={<MarketplacePage />} />
            <Route path="donations/:id" element={<DonationDetailPage />} />
            <Route path="impact" element={<ImpactAnalyticsPage />} />

            {/* Authenticated Routes */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardDispatcher />
                </ProtectedRoute>
              }
            />
            <Route
              path="create-donation"
              element={
                <ProtectedRoute allowedRoles={['DONOR', 'ADMIN']}>
                  <CreateDonationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="forecast"
              element={
                <ProtectedRoute allowedRoles={['DONOR', 'ADMIN']}>
                  <ForecastingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="matching"
              element={
                <ProtectedRoute>
                  <MatchingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin-dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Fallback 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

