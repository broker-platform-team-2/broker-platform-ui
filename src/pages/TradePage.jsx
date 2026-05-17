import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { D, FONT_HEAD, FONT_BODY } from '../theme/tokens';
import { AppShell } from '../components/shell/AppShell';
import { Card, Pill, Money, Delta, AreaChart, KPI } from '../components/shared/dark-ui';
import { getStocks, getStockHistory } from '../api/market';
import { placeOrder } from '../api/orders';
import { getMyHoldings } from '../api/holdings';
import { useAccount } from '../context/AccountContext';
import { useLivePrices, useNotificationMessage } from '../context/NotificationsContext';
import { fromUSD, getRate } from '../data/exchangeRates';

const SYMBOLS = {
  EUR: '€',  USD: '$',   GBP: '£',   CHF: 'CHF ', JPY: '¥',
  CAD: 'C$', AUD: 'A$',  NZD: 'NZ$', SEK: 'kr ',  NOK: 'kr ',
  DKK: 'kr ', HKD: 'HK$', SGD: 'S$', CNY: '¥',    INR: '₹',
  KRW: '₩',  BRL: 'R$',  MXN: 'MX$', ZAR: 'R ',  TRY: '₺',
  PLN: 'zł ', RON: 'lei ',
};

const Label = ({ children }) => (
  <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 6, fontFamily: FONT_BODY }}>{children}</div>
);

const SummaryRow = ({ label, value, hint, bold }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', fontFamily: FONT_BODY }}>
    <div style={{ fontSize: 12.5, color: bold ? D.ink : D.ink70 }}>
      {label}
      {hint && <span style={{ marginLeft: 6, fontSize: 11 }}>{hint}</span>}
    </div>
    <div style={{ fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 600, color: D.ink, fontFamily: FONT_HEAD, fontVariantNumeric: 'tabular-nums', letterSpacing: bold ? '-0.01em' : 'normal' }}>{value}</div>
  </div>
);

const stepBtn = {
  width: 40, height: 40,
  background: D.surface2, border: `1px solid ${D.hairline}`,
  color: D.ink, fontSize: 18, cursor: 'pointer',
  fontFamily: FONT_HEAD, fontWeight: 600,
  borderTopLeftRadius: 9, borderBottomLeftRadius: 9,
};

export default function TradePage() {
  const [searchParams] = useSearchParams();
  const initialTicker = searchParams.get('ticker');

  const [side, setSide] = useState('BUY');
  const [orderType, setOrderType] = useState('MARKET');
  const [ticker, setTicker] = useState(initialTicker || null);
  const [qty, setQty] = useState(10);
  const [limitPrice, setLimitPrice] = useState(null);
  const [tif, setTif] = useState('GTC');
  const [baseStocks, setBaseStocks] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);
  const livePrices = useLivePrices();

  const stocks = useMemo(() => baseStocks.map(s => {
    const live = livePrices[String(s.ticker).toUpperCase()];
    if (!live) return s;
    return {
      ...s,
      price: live.price || s.price,
      change: live.change ?? s.change,
      changePct: live.changePct ?? s.changePct,
      volume: live.volume || s.volume,
    };
  }), [baseStocks, livePrices]);
  const [range, setRange] = useState('1D');
  const [history, setHistory] = useState([]);
  const [livePoints, setLivePoints] = useState([]);
  const [timeSales, setTimeSales] = useState([]);
  const timeSalesRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  const [trades, setTrades] = useState([]);

  const { accounts, activeId, setActiveId, activeAccount } = useAccount();
  const [holdings, setHoldings] = useState([]);

  useEffect(() => {
    getStocks()
      .then(list => {
        setBaseStocks(list);
        if (list.length > 0) {
          const match = initialTicker && list.find(s => s.ticker === initialTicker);
          setTicker(match ? match.ticker : list[0].ticker);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingStocks(false));
  }, [initialTicker]);

  useEffect(() => {
    if (!ticker) return;
    setHistory([]);
    setLivePoints([]);
    setTimeSales([]);
    getStockHistory(ticker, range).then(h => { if (h.length) setHistory(h); }).catch(() => {});
  }, [ticker, range]);

  // Append each live PRICE_UPDATE tick for the selected stock to chart + time&sales
  useNotificationMessage((msg) => {
    if (msg?.type !== 'PRICE_UPDATE') return;
    if (String(msg.payload?.ticker).toUpperCase() !== String(ticker).toUpperCase()) return;
    const price = Number(msg.payload?.price);
    const change = Number(msg.payload?.change ?? 0);
    if (price <= 0) return;
    setLivePoints(prev => [...prev.slice(-500), price]);
    const entry = {
      id: Date.now() + Math.random(),
      time: msg.payload?.market_time ? new Date(msg.payload.market_time) : new Date(),
      price,
      change,
      dir: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
    };
    setTimeSales(prev => [entry, ...prev.slice(0, 199)]); // newest first, cap at 200
  });

  // Simulate live trades
  useEffect(() => {
    if (!ticker || loadingStocks) return;
    const stock = stocks.find(s => s.ticker === ticker);
    if (!stock) return;

    const interval = setInterval(() => {
      const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const offset = (Math.random() - 0.5) * 0.1;
      const price = stock.price + offset;
      const qty = Math.floor(Math.random() * 500) + 10;
      const now = new Date();
      const time = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setTrades(prev => [{ id: Date.now(), time, price, qty, side }, ...prev].slice(0, 15));
    }, 2000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [ticker, stocks, loadingStocks]);

  useEffect(() => {
    getMyHoldings().then(h => setHoldings(h || [])).catch(() => {});
  }, [confirmation]);

  useEffect(() => {
    const handler = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Hooks must be before early returns — use a safe price derived from stocks state
  const currentPrice = stocks.find(s => s.ticker === ticker)?.price ?? 0;

  // Chart: merge historical candles with live ticks from WebSocket
  const chartData = useMemo(() => {
    const base = history.length ? history : (currentPrice > 0 ? [currentPrice] : []);
    const combined = [...base, ...livePoints];
    return combined.length >= 2 ? combined : [...combined, ...new Array(Math.max(0, 2 - combined.length)).fill(currentPrice || 0)];
  }, [history, livePoints, currentPrice]);

  // Green if the chart ends higher than it started, red otherwise
  const chartColor = useMemo(() => {
    if (chartData.length < 2) return D.sage;
    return chartData[chartData.length - 1] >= chartData[0] ? D.sage : D.sell;
  }, [chartData]);

  if (loadingStocks) {
    return (
      <AppShell title="Trade" subtitle="Loading…">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: D.ink50, fontSize: 14 }}>
          Fetching market data…
        </div>
      </AppShell>
    );
  }

  if (stocks.length === 0) {
    return (
      <AppShell title="Trade" subtitle="Exchange unavailable">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: D.ink50, fontSize: 14 }}>
          No instruments available. Ensure the exchange is running.
        </div>
      </AppShell>
    );
  }

  const stock = stocks.find(s => s.ticker === ticker) || stocks[0];
  const holding = holdings.find(h => (h.instrumentId || h.ticker) === stock.ticker && (h.instrumentType || h.type) === 'STOCK');

  const execPrice = orderType === 'MARKET' ? stock.price : (limitPrice ?? stock.price);
  const fee = Math.max(1.0, qty * execPrice * 0.0008);
  const total = qty * execPrice + (side === 'BUY' ? fee : -fee);
  const proceeds = qty * execPrice - fee;

  const availBalance = Number(activeAccount?.balance || 0);
  const activeCurrency = activeAccount?.currency || 'USD';
  const activeSym = SYMBOLS[activeCurrency] || `${activeCurrency} `;
  const ownedQty = Number(holding?.amount || 0);

  const needsConversion = activeCurrency !== 'USD';
  const fxRate = getRate(activeCurrency);
  const totalInAccountCurrency = needsConversion ? fromUSD(side === 'BUY' ? total : proceeds, activeCurrency) : (side === 'BUY' ? total : proceeds);
  const feeInAccountCurrency = needsConversion ? fromUSD(fee, activeCurrency) : fee;

  const canAfford = side === 'BUY' ? totalInAccountCurrency <= availBalance : true;
  const canSell = side === 'SELL' ? qty <= ownedQty : true;
  const valid = qty > 0 && canAfford && canSell;

  async function submit() {
    setSubmitting(true);
    setError('');
    setConfirmation(null);
    try {
      const order = await placeOrder({
        instrumentType: 'STOCK',
        instrumentId: stock.ticker,
        orderType,
        side,
        quantity: qty,
        limitPrice: orderType === 'LIMIT' ? Number(limitPrice ?? stock.price) : null,
        expiresAt: null,
        currency: activeCurrency,
      });
      setConfirmation(order);
    } catch (e) {
      const raw = e?.response?.data?.error || e?.response?.data?.message;
      const msg = raw || 'Order could not be placed. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Trade" subtitle="Place orders on the Wakibi exchange">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 18, alignItems: 'stretch' }}>
        {/* Graphic representation card */}
        <Card padding={22} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, background: D.surface3,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14, color: D.ink, letterSpacing: 0.2,
              }}>{stock.ticker.slice(0, 4)}</div>
              <div>
                <select value={stock.ticker} onChange={(e) => setTicker(e.target.value)} style={{
                  background: 'transparent', border: 'none',
                  fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 22, color: D.ink, letterSpacing: '-0.01em',
                  cursor: 'pointer', appearance: 'none', paddingRight: 24,
                }}>
                  {stocks.map(s => <option key={s.ticker} value={s.ticker} style={{ background: D.surface2, color: D.ink }}>{s.ticker}</option>)}
                </select>
                <div style={{ fontSize: 13, color: D.ink50, marginTop: 2 }}>{stock.name} · {stock.sector}</div>
              </div>
            </div>

            {/* Range selector */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
              {['1D', '1W', '1M', '3M', '1Y'].map(r => (
                <button key={r} onClick={() => setRange(r)} style={{
                  padding: '4px 10px',
                  background: range === r ? D.surface3 : 'transparent',
                  border: `1px solid ${range === r ? D.hairline2 : D.hairline}`,
                  color: range === r ? D.ink : D.ink50,
                  borderRadius: 6, fontFamily: FONT_BODY, fontWeight: 600,
                  fontSize: 11, cursor: 'pointer',
                }}>{r}</button>
              ))}
              {livePoints.length > 0 && (
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: D.spring }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: D.spring, boxShadow: `0 0 6px ${D.spring}`, display: 'inline-block' }}/>
                  {livePoints.length} live tick{livePoints.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div style={{ marginLeft: -8, marginRight: -8 }}>
              <AreaChart data={chartData} height={140} color={chartColor}/>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', marginLeft: -8, marginRight: -8, minHeight: 320 }}>
            <AreaChart data={chartData} height={360} color={stock.changePct >= 0 ? D.sage : D.sell}/>
          </div>

          <Card padding={0} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Header */}
            <div style={{ padding: '16px 22px', borderBottom: `1px solid ${D.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15, color: D.ink, letterSpacing: '-0.01em' }}>Time & sales</div>
                <div style={{ fontSize: 11.5, color: D.ink50, marginTop: 2 }}>Price ticks for {stock.ticker}</div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: timeSales.length > 0 ? D.spring : D.ink50 }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: timeSales.length > 0 ? D.spring : D.ink50, boxShadow: timeSales.length > 0 ? `0 0 6px ${D.spring}` : 'none', display: 'inline-block' }}/>
                {timeSales.length > 0 ? 'Live' : 'Waiting…'}
              </span>
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '80px 1fr 80px',
              padding: '8px 18px', flexShrink: 0,
              fontSize: 10, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600,
              borderBottom: `1px solid ${D.hairline}`,
            }}>
              <div>Time</div><div style={{ textAlign: 'right' }}>Price</div><div style={{ textAlign: 'right' }}>Change</div>
            </div>

            {/* Scrollable tick list */}
            <div ref={timeSalesRef} style={{ flex: 1, overflowY: 'auto', maxHeight: 320 }}>
              {timeSales.length === 0 ? (
                <div style={{ padding: '28px 18px', textAlign: 'center', color: D.ink50, fontSize: 12 }}>
                  Waiting for the first tick on {stock.ticker}…
                </div>
              ) : timeSales.map(t => {
                const color = t.dir === 'up' ? D.buy : t.dir === 'down' ? D.sell : D.ink50;
                const hh = t.time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                return (
                  <div key={t.id} style={{
                    display: 'grid', gridTemplateColumns: '80px 1fr 80px',
                    padding: '6px 18px', alignItems: 'center',
                    borderBottom: `1px solid ${D.hairline}`,
                    fontFamily: FONT_BODY, fontSize: 12.5,
                  }}>
                    <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: D.ink50 }}>{hh}</div>
                    <div style={{ textAlign: 'right', fontFamily: FONT_HEAD, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
                      ${t.price.toFixed(2)}
                    </div>
                    <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color, fontSize: 11.5, fontWeight: 600 }}>
                      {t.dir === 'up' ? '+' : t.dir === 'down' ? '' : ''}{t.change.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: order ticket */}
        <Card padding={0} style={{ alignSelf: 'flex-start', position: 'sticky', top: 0, gridRow: 'span 2' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 16, gap: 8 }}>
            <button onClick={() => setSide('BUY')} style={{
              padding: '12px',
              background: side === 'BUY' ? D.buy : 'transparent',
              border: `1px solid ${side === 'BUY' ? D.buy : D.hairline2}`,
              color: side === 'BUY' ? D.plumDeep : D.ink70,
              borderRadius: 10, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: '-0.01em',
            }}>Buy</button>
            <button onClick={() => setSide('SELL')} style={{
              padding: '12px',
              background: side === 'SELL' ? D.sell : 'transparent',
              border: `1px solid ${side === 'SELL' ? D.sell : D.hairline2}`,
              color: side === 'SELL' ? '#fff' : D.ink70,
              borderRadius: 10, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: '-0.01em',
            }}>Sell</button>
          </div>

          <div style={{ padding: '0 16px 16px' }}>
            <Label>Funding account</Label>
            <div ref={pickerRef} style={{ position: 'relative', marginBottom: 16 }}>
              <button
                onClick={() => setPickerOpen(o => !o)}
                style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: D.surface2,
                  border: `1px solid ${pickerOpen ? D.sage : D.hairline}`,
                  borderRadius: pickerOpen ? '9px 9px 0 0' : 9,
                  padding: '10px 12px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontFamily: FONT_BODY, transition: 'border-color 0.15s',
                }}
              >
                <div style={{ background: D.sageBg, borderRadius: 6, padding: '3px 8px', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12, color: D.sage, flexShrink: 0 }}>{activeCurrency}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: D.ink, fontVariantNumeric: 'tabular-nums' }}>
                    {activeSym}{availBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: 11, color: D.ink50, marginTop: 1 }}>Available to trade</div>
                </div>
                <span style={{ color: D.ink50, fontSize: 11, display: 'inline-block', transform: pickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
              </button>

              {pickerOpen && (
                <div style={{
                  position: 'absolute', left: 0, right: 0, zIndex: 50,
                  background: D.surface2, border: `1px solid ${D.sage}`,
                  borderTop: 'none', borderRadius: '0 0 9px 9px', overflow: 'hidden',
                }}>
                  {accounts.map((a, i) => {
                    const isSel = String(a.accountId) === String(activeId);
                    const bal = Number(a.balance) || 0;
                    const sym = SYMBOLS[a.currency] || `${a.currency} `;
                    return (
                      <button key={a.accountId} onClick={() => { setActiveId(a.accountId); setPickerOpen(false); }} style={{
                        width: '100%', textAlign: 'left', cursor: 'pointer',
                        background: isSel ? D.sageBg : 'transparent',
                        border: 'none', borderBottom: i < accounts.length - 1 ? `1px solid ${D.hairline}` : 'none',
                        padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY,
                      }}>
                        <div style={{ background: isSel ? D.sageBg : D.surface3, borderRadius: 6, padding: '3px 8px', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12, color: isSel ? D.sage : D.ink50, flexShrink: 0 }}>{a.currency}</div>
                        <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: D.ink, fontVariantNumeric: 'tabular-nums' }}>
                          {sym}{bal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {isSel && <span style={{ color: D.sage, fontSize: 13 }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Label>Order type</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
              {['MARKET', 'LIMIT'].map(t => (
                <button key={t} onClick={() => setOrderType(t)} style={{
                  padding: '9px',
                  background: orderType === t ? D.surface3 : 'transparent',
                  border: `1px solid ${orderType === t ? D.hairline2 : D.hairline}`,
                  color: orderType === t ? D.ink : D.ink70,
                  borderRadius: 8, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                }}>{t === 'MARKET' ? 'Market' : 'Limit'}</button>
              ))}
            </div>

            <Label>Quantity (shares)</Label>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
              <button onClick={() => setQty(Math.max(0, qty - 1))} style={stepBtn}>−</button>
              <input type="number" value={qty} onChange={(e) => setQty(Math.max(0, +e.target.value))} style={{
                flex: 1, padding: '10px 12px',
                background: D.surface2, border: `1px solid ${D.hairline}`, borderLeft: 'none', borderRight: 'none',
                color: D.ink, fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 18,
                outline: 'none', textAlign: 'center', fontVariantNumeric: 'tabular-nums',
              }}/>
              <button onClick={() => setQty(qty + 1)} style={{ ...stepBtn, borderRadius: 0, borderTopRightRadius: 9, borderBottomRightRadius: 9, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>+</button>
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
              {[10, 25, 50, 100, 'Max'].map(v => (
                <button key={v} onClick={() => {
                  if (v === 'Max') {
                    if (side === 'BUY' && execPrice > 0) {
                      const availableInUSD = needsConversion ? availBalance / fxRate : availBalance;
                      setQty(Math.floor(availableInUSD / execPrice));
                    } else if (side === 'SELL') setQty(ownedQty);
                  } else setQty(v);
                }} style={{
                  flex: 1, padding: '5px', background: 'transparent', border: `1px solid ${D.hairline}`,
                  color: D.ink70, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY,
                }}>{v}</button>
              ))}
            </div>

            {orderType === 'LIMIT' && (
              <>
                <Label>Limit price</Label>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: D.surface2, border: `1px solid ${D.hairline}`,
                  borderRadius: 9, padding: '10px 12px', marginBottom: 6,
                }}>
                  <span style={{ color: D.ink50, fontFamily: FONT_HEAD, fontWeight: 600 }}>$</span>
                  <input type="number" step="0.01" value={limitPrice ?? ''} placeholder={stock.price.toFixed(2)}
                    onChange={(e) => setLimitPrice(e.target.value ? +e.target.value : null)}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      color: D.ink, fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 16, fontVariantNumeric: 'tabular-nums',
                    }}/>
                </div>
                <div style={{ marginBottom: 16, fontSize: 11, color: D.ink50 }}>
                  Mid <span style={{ color: D.ink70, fontVariantNumeric: 'tabular-nums' }}>${stock.price.toFixed(2)}</span>
                  {' · '}Spread <span style={{ color: D.ink70 }}>$0.10</span>
                </div>

                <Label>Time in force</Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
                  {[['GTC', "Good 'til cancel"], ['DAY', 'Day only'], ['IOC', 'Immediate']].map(([v, l]) => (
                    <button key={v} onClick={() => setTif(v)} title={l} style={{
                      padding: '8px',
                      background: tif === v ? D.surface3 : 'transparent',
                      border: `1px solid ${tif === v ? D.hairline2 : D.hairline}`,
                      color: tif === v ? D.ink : D.ink70,
                      borderRadius: 7, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11.5, cursor: 'pointer',
                    }}>{v}</button>
                  ))}
                </div>
              </>
            )}

            <div style={{ background: D.surface2, borderRadius: 12, padding: 14, marginTop: 4, marginBottom: 12, border: `1px solid ${D.hairline}` }}>
              <SummaryRow label={`${activeCurrency} available`} value={`${activeSym}${availBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}/>
              <div style={{ height: 1, background: D.hairline, margin: '8px 0' }}/>
              <SummaryRow label="Estimated price" value={orderType === 'MARKET' ? `$${stock.price.toFixed(2)} (mkt)` : `$${execPrice.toFixed(2)}`}/>
              <SummaryRow label="Subtotal" value={`$${(qty * execPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}/>
              <SummaryRow
                label="Platform fee · 0.08%"
                value={needsConversion
                  ? `${activeSym}${feeInAccountCurrency.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : `$${fee.toFixed(2)}`}
                hint={<span style={{ color: D.spring }}>→ microloans</span>}
              />
              {needsConversion && (
                <SummaryRow
                  label="Exchange rate"
                  value={`1 USD = ${fxRate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${activeCurrency}`}
                  hint={<span style={{ color: D.ink50, fontSize: 10 }}>indicative</span>}
                />
              )}
              <div style={{ height: 1, background: D.hairline, margin: '10px 0' }}/>
              <SummaryRow
                label={side === 'BUY' ? 'Total cost' : 'Net proceeds'}
                value={`${activeSym}${totalInAccountCurrency.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${needsConversion ? ` ${activeCurrency}` : ''}`}
                bold
              />
              {needsConversion && (
                <div style={{ fontSize: 11, color: D.ink50, marginTop: 6, lineHeight: 1.4 }}>
                  ≈ ${(side === 'BUY' ? total : proceeds).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD · debited from your {activeCurrency} account at this rate
                </div>
              )}
            </div>

            {!canAfford && side === 'BUY' && (
              <div style={{ background: D.sellBg, color: D.sell, padding: '10px 12px', borderRadius: 9, fontSize: 12, marginBottom: 12, border: `1px solid ${D.sell}33` }}>
                ⚠ Insufficient funds. Need {activeSym}{totalInAccountCurrency.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeCurrency}, available {activeSym}{availBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.
              </div>
            )}
            {!canSell && side === 'SELL' && (
              <div style={{ background: D.sellBg, color: D.sell, padding: '10px 12px', borderRadius: 9, fontSize: 12, marginBottom: 12, border: `1px solid ${D.sell}33` }}>
                ⚠ You hold {ownedQty} {stock.ticker}. Cannot sell {qty}.
              </div>
            )}
            {error && (
              <div style={{ background: D.sellBg, color: D.sell, padding: '10px 12px', borderRadius: 9, fontSize: 12, marginBottom: 12, border: `1px solid ${D.sell}33` }}>
                ⚠ {error}
              </div>
            )}
            {confirmation && (
              <div style={{ background: D.sageBg, color: D.sage, padding: '10px 12px', borderRadius: 9, fontSize: 12, marginBottom: 12, border: `1px solid ${D.sage}33` }}>
                ✓ Order placed · status {confirmation.status || 'PENDING'}
                {needsConversion && (
                  <div style={{ marginTop: 4, color: D.sage, opacity: 0.8 }}>
                    {activeSym}{totalInAccountCurrency.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {activeCurrency} will be {side === 'BUY' ? 'deducted from' : 'credited to'} your {activeCurrency} account
                  </div>
                )}
              </div>
            )}

            <button disabled={!valid || submitting} onClick={submit} style={{
              width: '100%', padding: '14px',
              background: !valid ? D.surface3 : (side === 'BUY' ? D.buy : D.sell),
              border: 'none',
              color: !valid ? D.ink50 : (side === 'BUY' ? D.plumDeep : '#fff'),
              borderRadius: 11, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14,
              cursor: valid && !submitting ? 'pointer' : 'not-allowed', letterSpacing: '-0.01em',
            }}>
              {submitting ? 'Submitting…' : `Place ${side === 'BUY' ? 'buy' : 'sell'} order`}
            </button>

            <div style={{ marginTop: 10, fontSize: 11, color: D.ink50, textAlign: 'center', lineHeight: 1.5 }}>
              {orderType === 'MARKET' ? 'Market orders execute at the best available price.' : 'Limit orders fill only at your price or better.'}
            </div>
          </div>
        </Card>

      </div>
    </AppShell>
  );
}
