import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import StocksPage from './pages/StocksPage';
import TradePage from './pages/TradePage';

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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/login"  element={<PublicOnlyRoute><AuthPage initial="login" /></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><AuthPage initial="signup" /></PublicOnlyRoute>} />
      <Route path="/forgot" element={<PublicOnlyRoute><AuthPage initial="forgot" /></PublicOnlyRoute>} />

      <Route path="/home"    element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/markets" element={<ProtectedRoute><StocksPage /></ProtectedRoute>} />
      <Route path="/trade"   element={<ProtectedRoute><TradePage /></ProtectedRoute>} />
      {/* Stubs for /orders and /wallet until dedicated screens land */}
      <Route path="/orders"  element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/wallet"  element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
