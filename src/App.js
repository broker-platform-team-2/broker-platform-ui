import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { NotificationsProvider } from './context/NotificationsContext';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import StocksPage from './pages/StocksPage';
import TradePage from './pages/TradePage';
import LandingPage from './pages/LandingPage';
import WalletPage from './pages/WalletPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';
import OptionsPage from './pages/OptionsPage';
import BotPage from './pages/BotPage';

function ProtectedLayout() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return (
    <NotificationsProvider>
      <Outlet />
    </NotificationsProvider>
  );
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/home" replace />;
  return children;
}

function RootRoute() {
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

      <Route element={<ProtectedLayout />}>
        <Route path="/home"    element={<HomePage />} />
        <Route path="/markets" element={<StocksPage />} />
        <Route path="/trade"   element={<TradePage />} />
        <Route path="/orders"  element={<OrdersPage />} />
        <Route path="/wallet"  element={<WalletPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/options" element={<OptionsPage />} />
        <Route path="/bot"     element={<BotPage />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>
    </Routes>
  );
}
