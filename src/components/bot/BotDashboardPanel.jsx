/**
 * BotDashboardPanel — live P&L dashboard for the trading bot.
 *
 * Data sources:
 *   - livePrices  (WebSocket, ~4 Hz)  → real-time position valuations
 *   - /holdings   (REST, polled 8 s)  → position list & avg costs
 *   - /accounts/me (REST, polled 8 s) → cash balance so the equity curve
 *                                        stays live even when flat (no positions)
 *   - equityHistory (ring buffer)     → sparkline equity curve
 *
 * KEY FIX: the chart tracks totalEquity = cashUSD + stockValue.
 * Previously it tracked only stockValue, which went to 0 when the bot
 * closed all positions — freezing the chart.  Cash never goes to 0, so
 * the curve continues updating even between trades.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { D, FONT_HEAD, FONT_BODY } from '../../theme/tokens';
import { Card, AreaChart } from '../shared/dark-ui';
import { getMyHoldings } from '../../api/holdings';
import { getMyAccounts } from '../../api/accounts';
import { toUSD } from '../../data/exchangeRates';
import { useLivePrices, useNotificationMessage } from '../../context/NotificationsContext';

// ── helpers ──────────────────────────────────────────────────────────────────

const fmt2 = v => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = v => `${v >= 0 ? '+' : ''}${Number(v).toFixed(2)}%`;
const fmtPnl = v => `${v >= 0 ? '+' : ''}$${fmt2(Math.abs(v))}`;

function PnlBadge({ value, pct }) {
  const isPos = value >= 0;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: isPos ? D.sageBg : D.sellBg,
      color: isPos ? D.sage : D.sell,
      fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13,
      fontVariantNumeric: 'tabular-nums',
    }}>
      {isPos ? '▲' : '▼'} {fmtPnl(value)}
      {pct != null && <span style={{ opacity: 0.75 }}>({fmtPct(pct)})</span>}
    </span>
  );
}

function StatBox({ label, value, tone, sub }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 22, color: tone || D.ink, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: D.ink50 }}>{sub}</div>}
    </div>
  );
}

// ── constants ──────────────────────────────────────────────────────────────────

const HISTORY_CAP = 150;   // ≈ 20 min of history at one point per 8 s
const POLL_MS     = 8_000;

// ── component ─────────────────────────────────────────────────────────────────

export default function BotDashboardPanel({ isRunning }) {
  const [holdings, setHoldings]   = useState([]);
  const [cashUSD,  setCashUSD]    = useState(0);   // total cash across all accounts, in USD
  const [loading,  setLoading]    = useState(true);
  const livePrices = useLivePrices();

  // Equity history for the chart.
  // Values = totalEquity = cashUSD + stockPortfolioValue (always > 0 while account exists).
  const [equityHistory, setEquityHistory] = useState([]);
  // Baseline captured on first non-zero equity reading (session start).
  const baselineRef   = useRef(null);
  const lastEquityRef = useRef(null);

  // ── fetch both holdings and cash in one shot ────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [rawH, rawA] = await Promise.all([getMyHoldings(), getMyAccounts()]);
      setHoldings(Array.isArray(rawH) ? rawH : []);

      // Sum all account balances converted to USD so the equity chart is in one currency.
      const totalCash = (Array.isArray(rawA) ? rawA : []).reduce((sum, acct) => {
        const bal = Number(acct.balance || 0);
        const cur = acct.currency || 'USD';
        return sum + (cur === 'USD' ? bal : toUSD(bal, cur));
      }, 0);
      setCashUSD(totalCash);
    } catch { /* keep last known state on network hiccup */ }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const id = setInterval(fetchAll, POLL_MS);
    return () => clearInterval(id);
  }, [fetchAll]);

  // Refresh immediately on fills so positions + cash update together.
  useNotificationMessage(msg => {
    if (msg?.type === 'ORDER_UPDATE') fetchAll();
  });

  // ── computed stock portfolio ────────────────────────────────────────────────
  const portfolio = useMemo(() => {
    const rows = holdings
      .filter(h => (h.instrumentType || h.type) === 'STOCK')
      .map(h => {
        const ticker  = (h.instrumentId || h.ticker || '').toUpperCase();
        const qty     = Number(h.amount || 0);
        const avgCost = Number(h.averageCost ?? h.avgCost ?? 0);
        const liveSnap = livePrices[ticker];
        const price   = liveSnap?.price || avgCost;
        const value   = qty * price;
        const cost    = qty * avgCost;
        const pnl     = value - cost;
        const pnlPct  = cost > 0 ? (pnl / cost) * 100 : 0;
        return { ticker, qty, avgCost, price, value, cost, pnl, pnlPct };
      })
      .filter(r => r.qty > 0);

    const totalValue  = rows.reduce((s, r) => s + r.value, 0);
    const totalCost   = rows.reduce((s, r) => s + r.cost,  0);
    const totalPnl    = totalValue - totalCost;
    const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;
    return { rows, totalValue, totalCost, totalPnl, totalPnlPct };
  }, [holdings, livePrices]);

  // ── total equity = cash + stock value ──────────────────────────────────────
  // This never goes to zero as long as the account exists, so the chart
  // keeps updating even when the bot has no open positions.
  const totalEquity = cashUSD + portfolio.totalValue;

  // ── equity history — append whenever equity changes ─────────────────────────
  useEffect(() => {
    // Don't record until we have real data (avoids a leading 0 spike).
    if (totalEquity <= 0) return;
    if (lastEquityRef.current === totalEquity) return;
    lastEquityRef.current = totalEquity;

    if (baselineRef.current === null) {
      baselineRef.current = totalEquity;
    }

    setEquityHistory(prev => {
      const next = [...prev, totalEquity];
      return next.length > HISTORY_CAP ? next.slice(next.length - HISTORY_CAP) : next;
    });
  }, [totalEquity]);

  // ── also push a point on every poll tick so chart advances even when ────────
  // price didn't move (e.g. market closed, bot flat).
  // We do this by appending on the fetchAll interval via a separate effect.
  const pushTimedPoint = useCallback(() => {
    if (totalEquity <= 0) return;
    setEquityHistory(prev => {
      const next = [...prev, totalEquity];
      return next.length > HISTORY_CAP ? next.slice(next.length - HISTORY_CAP) : next;
    });
  }, [totalEquity]);

  useEffect(() => {
    const id = setInterval(pushTimedPoint, POLL_MS);
    return () => clearInterval(id);
  }, [pushTimedPoint]);

  // ── session P&L ────────────────────────────────────────────────────────────
  const sessionPnl = baselineRef.current !== null && totalEquity > 0
    ? totalEquity - baselineRef.current
    : null;
  const sessionPnlPct = baselineRef.current && baselineRef.current > 0 && sessionPnl !== null
    ? (sessionPnl / baselineRef.current) * 100
    : null;

  const chartData  = equityHistory.length >= 2 ? equityHistory : [];
  const chartColor = sessionPnl === null ? D.sage : sessionPnl >= 0 ? D.sage : D.sell;

  // ── render ──────────────────────────────────────────────────────────────────
  if (loading && holdings.length === 0 && cashUSD === 0) {
    return (
      <Card padding={24} style={{ marginTop: 18 }}>
        <div style={{ color: D.ink50, fontSize: 14, textAlign: 'center', padding: '24px 0' }}>
          Loading dashboard…
        </div>
      </Card>
    );
  }

  return (
    <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Card padding={0} style={{ overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px',
          borderBottom: `1px solid ${D.hairline}`,
          background: `linear-gradient(135deg, ${D.surface2} 0%, rgba(89,191,138,0.06) 100%)`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isRunning ? D.sage : D.ink30,
              boxShadow: isRunning ? `0 0 8px ${D.sage}` : 'none',
            }} />
            <span style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15, color: D.ink }}>
              Live Bot Dashboard
            </span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {sessionPnl !== null && (
              <PnlBadge value={sessionPnl} pct={sessionPnlPct} />
            )}
            <span style={{ fontSize: 11, color: D.ink50 }}>
              {portfolio.rows.length} position{portfolio.rows.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* ── KPI strip ───────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderBottom: `1px solid ${D.hairline}`,
        }}>
          {[
            {
              label: 'Total equity',
              value: totalEquity > 0 ? `$${fmt2(totalEquity)}` : '—',
              tone: D.ink,
              sub: cashUSD > 0 ? `$${fmt2(cashUSD)} cash` : null,
            },
            {
              label: 'Unrealised P&L',
              value: portfolio.totalPnl !== 0 ? fmtPnl(portfolio.totalPnl) : '—',
              tone: portfolio.totalPnl >= 0 ? D.sage : D.sell,
              sub: portfolio.totalPnlPct !== 0 ? fmtPct(portfolio.totalPnlPct) : null,
            },
            {
              label: 'Session P&L',
              value: sessionPnl !== null ? fmtPnl(sessionPnl) : '—',
              tone: sessionPnl === null ? D.ink50 : sessionPnl >= 0 ? D.sage : D.sell,
              sub: sessionPnlPct !== null ? fmtPct(sessionPnlPct) : null,
            },
            {
              label: 'In positions',
              value: portfolio.totalValue > 0 ? `$${fmt2(portfolio.totalValue)}` : '—',
              tone: D.ink,
              sub: portfolio.totalCost > 0 ? `cost $${fmt2(portfolio.totalCost)}` : null,
            },
          ].map((s, i) => (
            <div key={s.label} style={{
              padding: '16px 20px',
              borderRight: i < 3 ? `1px solid ${D.hairline}` : 'none',
            }}>
              <StatBox label={s.label} value={s.value} tone={s.tone} sub={s.sub} />
            </div>
          ))}
        </div>

        {/* ── Equity chart — always live because it tracks cash + stocks ────── */}
        {chartData.length >= 2 ? (
          <AreaChart data={chartData} height={140} color={chartColor} glow={true} />
        ) : (
          <div style={{ padding: '20px 24px', color: D.ink50, fontSize: 13 }}>
            Equity curve will appear once the first data point is captured…
          </div>
        )}
      </Card>

      {/* ── Positions table ─────────────────────────────────────────────────── */}
      {portfolio.rows.length > 0 && (
        <Card padding={0}>
          <div style={{
            padding: '14px 20px',
            borderBottom: `1px solid ${D.hairline}`,
            fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14, color: D.ink,
          }}>
            Open Positions
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT_BODY, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${D.hairline}` }}>
                  {['Ticker', 'Qty', 'Avg cost', 'Live price', 'Value', 'P&L', '%'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: h === 'Ticker' ? 'left' : 'right',
                      color: D.ink50, fontWeight: 600, fontSize: 11,
                      textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio.rows
                  .slice()
                  .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))
                  .map((row, i) => {
                    const isPos = row.pnl >= 0;
                    return (
                      <tr key={row.ticker} style={{
                        borderBottom: i < portfolio.rows.length - 1
                          ? `1px solid ${D.hairline}` : 'none',
                      }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                              background: D.surface3,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontFamily: FONT_HEAD, fontWeight: 700, color: D.ink50,
                            }}>{row.ticker.slice(0, 3)}</div>
                            <span style={{ fontWeight: 700, color: D.ink }}>{row.ticker}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: D.ink70, fontVariantNumeric: 'tabular-nums' }}>
                          {row.qty.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: D.ink70, fontVariantNumeric: 'tabular-nums' }}>
                          ${fmt2(row.avgCost)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: D.ink, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          ${fmt2(row.price)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', color: D.ink, fontVariantNumeric: 'tabular-nums' }}>
                          ${fmt2(row.value)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <span style={{ color: isPos ? D.sage : D.sell, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                            {fmtPnl(row.pnl)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 6,
                            background: isPos ? D.sageBg : D.sellBg,
                            color: isPos ? D.sage : D.sell,
                            fontWeight: 700, fontSize: 12, fontVariantNumeric: 'tabular-nums',
                          }}>
                            {fmtPct(row.pnlPct)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {portfolio.rows.length === 0 && !loading && (
        <Card padding={20} style={{ textAlign: 'center' }}>
          <div style={{ color: D.ink50, fontSize: 13 }}>
            {isRunning
              ? 'Bot is running — all cash, waiting for next entry signal…'
              : 'No open positions. Start the bot to begin trading.'}
          </div>
          {cashUSD > 0 && (
            <div style={{ marginTop: 8, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, color: D.ink }}>
              ${fmt2(cashUSD)} available in account
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
