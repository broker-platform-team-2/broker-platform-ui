import React, { useEffect, useMemo, useState } from 'react';
import { D, FONT_HEAD, FONT_BODY } from '../theme/tokens';
import { AppShell } from '../components/shell/AppShell';
import { Card, Pill, Money, Delta, Sparkline, AreaChart, genSeries } from '../components/shared/dark-ui';
import { getStocks } from '../api/market';
import { getMyHoldings } from '../api/holdings';
import { getMyTransactions } from '../api/transactions';
import { getMyAccounts } from '../api/accounts';
import { useAuth } from '../context/AuthContext';
import { useLivePrices } from '../context/NotificationsContext';

const Stat = ({ label, value, tone }) => (
  <div>
    <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{label}</div>
    <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 18, color: tone || D.ink, marginTop: 3, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
  </div>
);

const STATUS_COLORS = {
  FILLED:           { color: D.sage,  bg: D.sageBg },
  PARTIALLY_FILLED: { color: D.warn,  bg: D.warnBg },
  PARTIAL:          { color: D.warn,  bg: D.warnBg },
  PENDING:          { color: D.warn,  bg: D.warnBg },
  CANCELED:         { color: D.ink50, bg: 'rgba(255,255,255,0.06)' },
  CANCELLED:        { color: D.ink50, bg: 'rgba(255,255,255,0.06)' },
  EXPIRED:          { color: D.ink50, bg: 'rgba(255,255,255,0.06)' },
  REJECTED:         { color: D.sell,  bg: D.sellBg },
};

const CURRENCY_LABEL = {
  EUR: 'Euro',
  RON: 'Romanian leu',
  USD: 'US Dollar',
  GBP: 'British Pound',
  CHF: 'Swiss Franc',
};

export default function HomePage() {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [baseStockMap, setBaseStockMap] = useState({});

  const livePrices = useLivePrices();

  // Overlay live PRICE_UPDATEs over the initial REST snapshot so portfolio
  // valuations and any displayed prices keep pace with the exchange feed.
  const stockMap = useMemo(() => {
    const out = { ...baseStockMap };
    for (const ticker of Object.keys(livePrices)) {
      const live = livePrices[ticker];
      const base = out[ticker];
      if (!live) continue;
      out[ticker] = {
        ...(base || { ticker, name: ticker, sector: 'Other', volume: 0, mcap: '—', volatility: 0.03 }),
        price: live.price || base?.price || 0,
        change: live.change ?? base?.change ?? 0,
        changePct: live.changePct ?? base?.changePct ?? 0,
        volume: live.volume || base?.volume || 0,
      };
    }
    return out;
  }, [baseStockMap, livePrices]);

  useEffect(() => {
    getStocks()
      .then(list => { if (list.length > 0) setBaseStockMap(Object.fromEntries(list.map(s => [s.ticker, s]))); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [h, t, a] = await Promise.allSettled([
          getMyHoldings(), getMyTransactions(), getMyAccounts(),
        ]);
        if (h.status === 'fulfilled') setHoldings(h.value || []);
        if (t.status === 'fulfilled') setTransactions((t.value || []).slice(0, 6));
        if (a.status === 'fulfilled') setAccounts(a.value || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const portfolio = useMemo(() => {
    let totalValue = 0, totalCost = 0;
    const rows = (holdings || [])
      .filter(h => (h.instrumentType || h.type) === 'STOCK')
      .map(h => {
        const ticker = h.instrumentId || h.ticker;
        const stock = stockMap[ticker];
        const amount = Number(h.amount || 0);
        const avgCost = Number(h.averageCost ?? h.avgCost ?? 0);
        const value = amount * (stock?.price ?? avgCost);
        const cost = amount * avgCost;
        totalValue += value; totalCost += cost;
        const pnl = value - cost;
        const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
        return { ticker, stock, amount, avgCost, value, cost, pnl, pnlPct };
      });
    const totalPnl = totalValue - totalCost;
    const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
    return { rows, totalValue, totalCost, totalPnl, totalPnlPct };
  }, [holdings, stockMap]);

  const portfolioSeries = useMemo(
    () => genSeries(42, 80, 100, 0.025).map(v => v * Math.max(1, portfolio.totalValue) / 100),
    [portfolio.totalValue]
  );

  const primary = accounts.find(a => a.currency === 'USD') || accounts[0];
  const primaryAvailable = Number(primary?.balance ?? 0);
  const primaryCurrency = primary?.currency || 'USD';


  return (
    <AppShell title="Home"
      subtitle={loading ? 'Loading…' : `Welcome back${user?.username ? `, @${user.username}` : ''}`}>

      {/* Hero row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18, marginBottom: 18 }}>
        <Card padding={26} style={{
          background: `linear-gradient(135deg, ${D.surface} 0%, ${D.surface2} 100%)`,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', right: -60, top: -60, width: 220, height: 220,
            borderRadius: '50%', background: `radial-gradient(circle, ${D.sage}22 0%, transparent 70%)`,
            pointerEvents: 'none',
          }}/>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <div style={{ fontSize: 12, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Portfolio Value</div>
              <div style={{ marginTop: 8 }}>
                <Money value={portfolio.totalValue} currency="USD" big/>
              </div>
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Delta value={portfolio.totalPnl} pct={portfolio.totalPnlPct}/>
                <span style={{ color: D.ink50, fontSize: 12.5 }}>all-time</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['1D', '1W', '1M', '3M', 'YTD', 'ALL'].map((r, i) => (
                <button key={r} style={{
                  background: i === 4 ? D.sage : 'transparent',
                  border: `1px solid ${i === 4 ? D.sage : D.hairline}`,
                  color: i === 4 ? D.plumDeep : D.ink70,
                  padding: '5px 10px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                  fontFamily: FONT_BODY,
                }}>{r}</button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 18, marginLeft: -8, marginRight: -8 }}>
            <AreaChart data={portfolioSeries} height={140} color={D.sage}/>
          </div>
        </Card>

        <Card padding={22}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, color: D.ink, letterSpacing: '-0.01em' }}>
              {accounts.length > 1 ? 'Accounts' : 'Account'}
            </div>
            <button style={{ background: 'none', border: 'none', color: D.sage, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY }}>+ Deposit</button>
          </div>

          {accounts.length === 0 && (
            <div style={{ padding: '24px 0', color: D.ink50, fontSize: 13, textAlign: 'center' }}>
              {loading ? 'Loading…' : 'No accounts yet.'}
            </div>
          )}

          {accounts.map((a, i) => {
            const available = Number(a.balance) || 0;
            const frozen = Number(a.frozenBalance) || 0;
            const isPrimary = i === 0;
            return (
              <div key={a.accountId} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${D.hairline}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: isPrimary ? D.sageBg : D.surface3,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13,
                    color: isPrimary ? D.sage : D.ink70,
                  }}>{a.currency}</div>
                  <div>
                    <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, color: D.ink }}>
                      {isPrimary ? 'Primary' : 'Secondary'} · {CURRENCY_LABEL[a.currency] || a.currency}
                    </div>
                    {frozen > 0 && (
                      <div style={{ fontSize: 11.5, color: D.warn, marginTop: 2 }}>
                        <Money value={frozen} currency={a.currency}/> frozen in open orders
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Money value={available} currency={a.currency}/>
                  <div style={{ fontSize: 11, color: D.ink50, marginTop: 1 }}>available</div>
                </div>
              </div>
            );
          })}
        </Card>
      </div>

      {/* Holdings + Profile */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>
        <Card padding={0}>
          <div style={{ padding: '18px 22px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, color: D.ink, letterSpacing: '-0.01em' }}>Holdings</div>
              <div style={{ fontSize: 12, color: D.ink50, marginTop: 2 }}>
                {portfolio.rows.length} stock positions · {(holdings || []).filter(h => (h.instrumentType || h.type) === 'OPTION').length} options
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.9fr 1fr 1fr 0.8fr',
            padding: '10px 22px',
            fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600,
            borderTop: `1px solid ${D.hairline}`, borderBottom: `1px solid ${D.hairline}`,
          }}>
            <div>Asset</div><div>Qty</div><div>Avg cost</div><div>Market price</div>
            <div style={{ textAlign: 'right' }}>Value</div><div style={{ textAlign: 'right' }}>P&amp;L</div>
          </div>

          {portfolio.rows.length === 0 && (
            <div style={{ padding: '40px 22px', textAlign: 'center', color: D.ink50, fontSize: 13 }}>
              {loading ? 'Loading holdings…' : 'No holdings yet — place your first order from the Trade tab.'}
            </div>
          )}

          {portfolio.rows.map((row, i) => (
            <div key={row.ticker} style={{
              display: 'grid', gridTemplateColumns: '1.4fr 0.8fr 0.9fr 1fr 1fr 0.8fr',
              padding: '14px 22px', alignItems: 'center',
              borderBottom: i === portfolio.rows.length - 1 ? 'none' : `1px solid ${D.hairline}`,
              fontFamily: FONT_BODY, fontSize: 13.5,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: D.surface3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 11.5,
                  color: D.ink, letterSpacing: 0.3,
                }}>{row.ticker.slice(0, 4)}</div>
                <div>
                  <div style={{ fontWeight: 600, color: D.ink }}>{row.ticker}</div>
                  <div style={{ fontSize: 11.5, color: D.ink50 }}>{row.stock?.name || '—'}</div>
                </div>
              </div>
              <div style={{ color: D.ink, fontVariantNumeric: 'tabular-nums' }}>{row.amount}</div>
              <div style={{ color: D.ink70, fontVariantNumeric: 'tabular-nums' }}>${row.avgCost.toFixed(2)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: D.ink, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>${(row.stock?.price ?? row.avgCost).toFixed(2)}</span>
                <Sparkline data={genSeries(row.ticker.charCodeAt(0) + i * 17, 24, 100, row.stock?.volatility || 0.03)} width={56} height={20}/>
              </div>
              <div style={{ textAlign: 'right', color: D.ink, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                ${row.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: row.pnl >= 0 ? D.buy : D.sell, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {row.pnl >= 0 ? '+' : '−'}${Math.abs(row.pnl).toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: row.pnl >= 0 ? D.buy : D.sell, opacity: 0.8 }}>
                  {row.pnl >= 0 ? '+' : '−'}{Math.abs(row.pnlPct).toFixed(2)}%
                </div>
              </div>
            </div>
          ))}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card padding={22}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 26,
                background: `linear-gradient(135deg, ${D.sage}, ${D.teal})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 17, color: D.plumDeep,
              }}>{user?.username?.slice(0, 2).toUpperCase() || 'WB'}</div>
              <div>
                <div style={{ fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 16, color: D.ink }}>{user?.username || 'Trader'}</div>
                <div style={{ fontSize: 12, color: D.ink50 }}>{user?.email || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <Stat label="Trades" value={transactions.length}/>
              <Stat label="Realised P&L" value={`$${portfolio.totalPnl.toFixed(0)}`} tone={portfolio.totalPnl >= 0 ? D.sage : D.sell}/>
              <Stat label="Holdings" value={portfolio.rows.length}/>
              <Stat label={`Cash · ${primaryCurrency}`} value={
                primaryCurrency === 'USD' ? `$${primaryAvailable.toFixed(0)}`
                : primaryCurrency === 'RON' ? `lei ${primaryAvailable.toFixed(0)}`
                : `${primaryAvailable.toFixed(0)} ${primaryCurrency}`
              }/>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent transactions */}
      <Card padding={0}>
        <div style={{ padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${D.hairline}` }}>
          <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, color: D.ink, letterSpacing: '-0.01em' }}>Recent transactions</div>
        </div>
        {transactions.length === 0 && (
          <div style={{ padding: '40px 22px', textAlign: 'center', color: D.ink50, fontSize: 13 }}>
            {loading ? 'Loading…' : 'No transactions yet.'}
          </div>
        )}
        {transactions.map((tx, i) => {
          const status = (tx.status || '').toUpperCase();
          const sc = STATUS_COLORS[status] || { color: D.ink50, bg: 'rgba(255,255,255,0.06)' };
          const ticker = tx.instrumentId || tx.ticker || '—';
          const qty = Number(tx.quantity ?? tx.qty ?? 0);
          const price = Number(tx.price ?? 0);
          return (
            <div key={tx.transactionId || tx.id || i} style={{
              display: 'grid', gridTemplateColumns: '40px 1fr 1fr 1fr 1fr 110px',
              padding: '14px 22px', alignItems: 'center', gap: 12,
              borderBottom: i === transactions.length - 1 ? 'none' : `1px solid ${D.hairline}`,
              fontFamily: FONT_BODY, fontSize: 13,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: tx.type === 'BUY' ? D.buyBg : D.sellBg,
                color: tx.type === 'BUY' ? D.buy : D.sell,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
              }}>{tx.type === 'BUY' ? '↓' : '↑'}</div>
              <div>
                <div style={{ color: D.ink, fontWeight: 600 }}>{tx.type === 'BUY' ? 'Bought' : 'Sold'} {ticker}</div>
                <div style={{ fontSize: 11.5, color: D.ink50, marginTop: 1 }}>Order {tx.exchangeOrderId ?? tx.orderId ?? '—'}</div>
              </div>
              <div style={{ color: D.ink70, fontVariantNumeric: 'tabular-nums' }}>
                {qty} <span style={{ color: D.ink50 }}>shares</span>
              </div>
              <div style={{ color: D.ink70, fontVariantNumeric: 'tabular-nums' }}>@ ${price.toFixed(2)}</div>
              <div><Pill color={sc.color} bg={sc.bg}>{status || 'PENDING'}</Pill></div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: D.ink, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  ${(qty * price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 11, color: D.ink50, marginTop: 1 }}>
                  {tx.date ? new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                </div>
              </div>
            </div>
          );
        })}
      </Card>
    </AppShell>
  );
}
