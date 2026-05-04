import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import StocksPage from './pages/StocksPage';
import TradePage from './pages/TradePage';
import LandingPage from './pages/LandingPage';
import WalletPage from './pages/WalletPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return children;
}

function RootRoute() {
  // Authenticated visitors land on /home; guests get the marketing landing page.
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />

      <Route path="/login"   element={<PublicOnlyRoute><AuthPage initial="login" /></PublicOnlyRoute>} />
      <Route path="/signup"  element={<PublicOnlyRoute><AuthPage initial="signup" /></PublicOnlyRoute>} />
      <Route path="/forgot"  element={<PublicOnlyRoute><AuthPage initial="forgot" /></PublicOnlyRoute>} />
      <Route path="/landing" element={<LandingPage />} />

      <Route path="/home"    element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/markets" element={<ProtectedRoute><StocksPage /></ProtectedRoute>} />
      <Route path="/trade"   element={<ProtectedRoute><TradePage /></ProtectedRoute>} />
      <Route path="/orders"  element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/wallet"  element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
