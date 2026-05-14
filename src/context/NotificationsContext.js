import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { getMarketStatus } from '../api/market';

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [marketStatus, setMarketStatus] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    getMarketStatus().then(setMarketStatus).catch(() => {});
    const interval = setInterval(() => {
      getMarketStatus().then(setMarketStatus).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMessage = useCallback((msg) => {
    if (msg.type === 'MARKET_EVENT') {
      getMarketStatus().then(setMarketStatus).catch(() => {});
    }
    if (['ORDER_UPDATE', 'MARKET_EVENT', 'PRICE_UPDATE'].includes(msg.type)) {
      setNotifications(prev => [...prev.slice(-49), msg]);
    }
  }, []);

  useNotifications(handleMessage);

  return (
    <NotificationsContext.Provider value={{ marketStatus, notifications, setNotifications }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  return useContext(NotificationsContext);
}
