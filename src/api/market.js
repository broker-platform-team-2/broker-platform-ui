import axios from 'axios';

const exchange = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:8180') + '/exchange',
});

function normalizeStock(s) {
  const price = Number(s.current_price ?? s.currentPrice ?? s.price ?? s.lastPrice ?? 0);
  const open = Number(s.open_price ?? s.openPrice ?? s.previousClose ?? s.open ?? price);
  const change = +(price - open).toFixed(2);
  const changePct = open > 0 ? +((change / open) * 100).toFixed(2) : 0;
  return {
    ticker: s.ticker ?? s.symbol ?? s.id,
    name: s.name ?? s.companyName ?? s.fullName ?? s.ticker,
    sector: s.sector ?? s.industry ?? s.category ?? 'Other',
    price,
    change,
    changePct,
    volume: Number(s.volume ?? s.dailyVolume ?? 0),
    mcap: s.marketCap ?? s.mcap ?? '—',
    volatility: Number(s.volatility ?? s.sigma ?? 0.03),
  };
}

function normalizeLevel(level) {
  return {
    price: Number(level.price ?? level.p ?? level.limitPrice ?? 0),
    qty: Number(level.quantity ?? level.size ?? level.qty ?? level.q ?? level.volume ?? 0),
  };
}

export async function getStocks() {
  const { data } = await exchange.get('/market/stocks');
  const list = Array.isArray(data) ? data : (data.stocks ?? data.data ?? data.items ?? []);
  return list.map(normalizeStock).filter(s => s.ticker && s.price > 0);
}

export async function getStock(ticker) {
  const { data } = await exchange.get(`/market/stocks/${ticker}`);
  return normalizeStock(data);
}

export async function getOrderBook(ticker) {
  const { data } = await exchange.get(`/market/stocks/${ticker}/orderbook`);
  const raw = data.orderBook ?? data.order_book ?? data;
  const bids = (raw.bids ?? raw.buyOrders ?? raw.buy ?? []).map(normalizeLevel)
    .filter(b => b.price > 0)
    .sort((a, b) => b.price - a.price)
    .slice(0, 7);
  const asks = (raw.asks ?? raw.sellOrders ?? raw.sell ?? []).map(normalizeLevel)
    .filter(a => a.price > 0)
    .sort((a, b) => a.price - b.price)
    .slice(0, 7);
  return { bids, asks };
}

export async function getStockHistory(ticker, range = '1M') {
  const now = new Date();
  const from = new Date(now);
  if      (range === '1D')  from.setDate(now.getDate() - 1);
  else if (range === '1W')  from.setDate(now.getDate() - 7);
  else if (range === '1M')  from.setMonth(now.getMonth() - 1);
  else if (range === '3M')  from.setMonth(now.getMonth() - 3);
  else if (range === 'YTD') from.setMonth(0, 1);
  else if (range === '1Y')  from.setFullYear(now.getFullYear() - 1);
  else                      from.setFullYear(now.getFullYear() - 10);

  const interval = range === '1D' ? 'minute' : 'hour';
  const params = range === 'ALL'
    ? { interval }
    : { interval, from: from.toISOString(), to: now.toISOString() };
  const { data } = await exchange.get(`/market/stocks/${ticker}/history`, { params });
  const candles = Array.isArray(data) ? data : (data.candles ?? data.history ?? data.data ?? []);
  return candles
    .map(c => Number(c.current_price ?? c.close ?? c.closePrice ?? c.price ?? c))
    .filter(v => !isNaN(v) && v > 0);
}
