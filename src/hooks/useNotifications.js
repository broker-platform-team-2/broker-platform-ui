import { useEffect, useRef, useState } from 'react';
import { getToken } from '../api/client';

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8088/ws';

/**
 * Subscribes to notification-service WebSocket and exposes the latest message.
 * Auto-reconnects with backoff. Calls onMessage(parsed) for every event if provided.
 */
export function useNotifications(onMessage) {
  const [lastMessage, setLastMessage] = useState(null);
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    let ws;
    let retry = 0;
    let cancelled = false;
    let reconnectTimer;

    const connect = () => {
      ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
      ws.onopen = () => { setConnected(true); retry = 0; };
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          setLastMessage(msg);
          handlerRef.current?.(msg);
        } catch {
          /* ignore */
        }
      };
      ws.onclose = () => {
        setConnected(false);
        if (cancelled) return;
        retry = Math.min(retry + 1, 5);
        reconnectTimer = setTimeout(connect, 1000 * 2 ** retry);
      };
      ws.onerror = () => { try { ws.close(); } catch { /* noop */ } };
    };

    connect();
    return () => {
      cancelled = true;
      clearTimeout(reconnectTimer);
      try { ws?.close(); } catch { /* noop */ }
    };
  }, []);

  return { lastMessage, connected };
}
