import { api } from './client';

export async function getBotStatus() {
  const { data } = await api.get('/bots/status');
  return data;
}

export async function subscribeBot(currency = 'USD') {
  const { data } = await api.post(`/bots/subscribe?currency=${currency}`);
  return data;
}

export async function startBot() {
  const { data } = await api.post('/bots/start');
  return data;
}

export async function stopBot() {
  const { data } = await api.post('/bots/stop');
  return data;
}

/**
 * Set which account the bot should trade in.
 * Backend: PUT /bots/trading-account  { accountId }
 */
export async function setBotTradingAccount(accountId) {
  const { data } = await api.put('/bots/trading-account', { accountId });
  return data;
}

/**
 * Get a snapshot of the bot's current P&L for the active session.
 * Backend: GET /bots/pnl
 * Returns: { sessionStartEquity, currentEquity, realizedPnl, unrealizedPnl, tradeCount }
 * Falls back gracefully if the endpoint doesn't exist yet.
 */
export async function getBotPnl() {
  const { data } = await api.get('/bots/pnl');
  return data;
}