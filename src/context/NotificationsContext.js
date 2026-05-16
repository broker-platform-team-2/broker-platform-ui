import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { getMarketStatus } from '../api/market';

const NotificationsContext = createContext(null);

/**
 * Build a normalized "live" snapshot from a PRICE_UPDATE payload.
 * Source schema (price-simulation):
 *   { ticker, price, change, change_pct, volume, market_time }
 */
function snapshotFromPriceUpdate(payload) {
  const price = Number(payload.price ?? 0);
  const change = Number(payload.change ?? 0);
  const changePct = Number(payload.change_pct ?? payload.changePct ?? 0);
  const volume = Number(payload.volume ?? 0);
  return {
    price: isFinite(price) ? price : 0,
    change: isFinite(change) ? change : 0,
    changePct: isFinite(changePct) ? changePct : 0,
    volume: isFinite(volume) ? volume : 0,
    marketTime: payload.market_time ?? payload.marketTime ?? null,
  };
}

export function NotificationsProvider({ children }) {
  const [marketStatus, setMarketStatus] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Live prices keyed by ticker. We use a ref for high-frequency writes and
  // mirror to state via a throttled tick so React re-renders are bounded
  // (50 ticker updates/second otherwise would thrash every subscribed page).
  const livePricesRef = useRef({});
  const [livePrices, setLivePrices] = useState({});
  const dirtyRef = useRef(false);

  useEffect(() => {
    getMarketStatus().then(setMarketStatus).catch(() => {});
    const interval = setInterval(() => {
      getMarketStatus().then(setMarketStatus).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Flush the prices ref to state at most every 250ms.
  useEffect(() => {
    const flush = setInterval(() => {
      if (dirtyRef.current) {
        dirtyRef.current = false;
        setLivePrices({ ...livePricesRef.current });
      }
    }, 250);
    return () => clearInterval(flush);
  }, []);

  const handleMessage = useCallback((msg) => {
    if (msg.type === 'MARKET_EVENT') {
      getMarketStatus().then(setMarketStatus).catch(() => {});
    }
    if (msg.type === 'PRICE_UPDATE' && msg.payload) {
      const ticker = msg.payload.ticker;
      if (ticker) {
        livePricesRef.current[String(ticker).toUpperCase()] = snapshotFromPriceUpdate(msg.payload);
        dirtyRef.current = true;
      }
    }
    // Keep the rolling toast/notification feed — but skip PRICE_UPDATE here so
    // we don't spam it with hundreds of entries per second.
    if (['ORDER_UPDATE', 'MARKET_EVENT'].includes(msg.type)) {
      setNotifications(prev => [...prev.slice(-49), msg]);
    }
  }, []);

  useNotifications(handleMessage);

  return (
    <NotificationsContext.Provider value={{ marketStatus, notifications, setNotifications, livePrices }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  return useContext(NotificationsContext);
}

/**
 * Convenience hook returning the live-price snapshot for a single ticker
 * (or `null` if no update has been received yet).
 */
export function useLivePrice(ticker) {
  const { livePrices } = useNotificationsContext() ?? {};
  if (!ticker || !livePrices) return null;
  return livePrices[String(ticker).toUpperCase()] ?? null;
}

/**
 * Returns the full live-prices map { TICKER: { price, change, changePct, volume, marketTime } }.
 */
export function useLivePrices() {
  const { livePrices } = useNotificationsContext() ?? {};
  return livePrices ?? {};
}
