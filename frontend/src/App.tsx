import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { MainLayout } from './layouts/MainLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MarketDiscoveryPage } from './pages/MarketDiscoveryPage';
import { MarketplacePage } from './pages/MarketplacePage';

// Dashboards
import { FarmerDashboard } from './pages/dashboards/FarmerDashboard';
import { BuyerDashboard } from './pages/dashboards/BuyerDashboard';
import FPODashboard from './pages/dashboards/FPODashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';

// Feature Pages
import TransactionsPage from './pages/TransactionsPage';
import StorageLogisticsPage from './pages/StorageLogisticsPage';
import KYCPage from './pages/KYCPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (user.role as string)?.toUpperCase();
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Strictly redirect to user's own home dashboard
    if (userRole === 'FARMER') return <Navigate to="/dashboard/farmer" replace />;
    if (userRole === 'BUYER') return <Navigate to="/dashboard/buyer" replace />;
    if (userRole === 'FPO') return <Navigate to="/dashboard/fpo" replace />;
    if (userRole === 'ADMIN') return <Navigate to="/dashboard/admin" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Automatic Dashboard Dispatcher
const DashboardRedirect: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  const role = (user.role as string)?.toUpperCase();
  if (role === 'FARMER') return <Navigate to="/dashboard/farmer" replace />;
  if (role === 'BUYER') return <Navigate to="/dashboard/buyer" replace />;
  if (role === 'FPO') return <Navigate to="/dashboard/fpo" replace />;
  if (role === 'ADMIN') return <Navigate to="/dashboard/admin" replace />;
  return <Navigate to="/marketplace" replace />;
};

// Redirect signed-in users directly to their own dashboard
const PublicOrDashboard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  if (user) {
    return <DashboardRedirect />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes - Auto-redirects to user dashboard if signed in */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<PublicOrDashboard><LandingPage /></PublicOrDashboard>} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/price-discovery" element={<MarketDiscoveryPage />} />
            <Route path="/login" element={<PublicOrDashboard><LoginPage /></PublicOrDashboard>} />
            <Route path="/register" element={<PublicOrDashboard><RegisterPage /></PublicOrDashboard>} />
          </Route>

          {/* Authenticated Dashboard Routes - Strictly for specific roles only */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route
              path="/dashboard/farmer"
              element={
                <ProtectedRoute allowedRoles={['FARMER']}>
                  <FarmerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/buyer"
              element={
                <ProtectedRoute allowedRoles={['BUYER']}>
                  <BuyerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/fpo"
              element={
                <ProtectedRoute allowedRoles={['FPO']}>
                  <FPODashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/storage-logistics" element={<StorageLogisticsPage />} />
            <Route path="/kyc" element={<KYCPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
