import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { D, FONT_HEAD, FONT_BODY } from '../theme/tokens';
import { AppShell } from '../components/shell/AppShell';
import { Card, Pill, Money, Delta, AreaChart, KPI, genSeries, seedRand } from '../components/shared/dark-ui';
import { STOCKS } from '../data/mockMarket';
import { placeOrder } from '../api/orders';
import { getBalance } from '../api/accounts';
import { getMyHoldings } from '../api/holdings';

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
  const initialTicker = searchParams.get('ticker') || 'ZEDA';

  const [side, setSide] = useState('BUY');
  const [orderType, setOrderType] = useState('MARKET');
  const [ticker, setTicker] = useState(initialTicker);
  const [qty, setQty] = useState(10);
  const [limitPrice, setLimitPrice] = useState(null);
  const [tif, setTif] = useState('GTC');
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');

  const [balance, setBalance] = useState({ available: 0, frozen: 0 });
  const [holdings, setHoldings] = useState([]);

  useEffect(() => {
    Promise.allSettled([getBalance(), getMyHoldings()]).then(([b, h]) => {
      if (b.status === 'fulfilled') setBalance(b.value || { available: 0, frozen: 0 });
      if (h.status === 'fulfilled') setHoldings(h.value || []);
    });
  }, [confirmation]);

  const stock = STOCKS.find(s => s.ticker === ticker);
  const holding = holdings.find(h => (h.instrumentId || h.ticker) === ticker && (h.instrumentType || h.type) === 'STOCK');

  const execPrice = orderType === 'MARKET' ? stock.price : (limitPrice ?? stock.price);
  const fee = Math.max(1.0, qty * execPrice * 0.0008);
  const total = qty * execPrice + (side === 'BUY' ? fee : -fee);
  const proceeds = qty * execPrice - fee;

  const eurAvail = Number(balance.available || 0);
  const ownedQty = Number(holding?.amount || 0);

  const canAfford = side === 'BUY' ? total <= eurAvail : true;
  const canSell = side === 'SELL' ? qty <= ownedQty : true;
  const valid = qty > 0 && canAfford && canSell;

  const recentTrades = useMemo(() => {
    const r = seedRand(stock.ticker.charCodeAt(0));
    const out = [];
    let p = stock.price;
    for (let i = 0; i < 10; i++) {
      p = p + (r() - 0.5) * stock.volatility * stock.price * 0.3;
      out.push({
        time: `14:${String(42 - i).padStart(2, '0')}:${String(Math.floor(r() * 60)).padStart(2, '0')}`,
        price: +p.toFixed(2),
        qty: Math.floor(r() * 200 + 20),
        side: r() > 0.5 ? 'BUY' : 'SELL',
      });
    }
    return out;
  }, [stock]);

  const series = useMemo(() => genSeries(stock.ticker.charCodeAt(0) * 7, 60, stock.price * 0.9, stock.volatility), [stock]);

  async function submit() {
    setSubmitting(true);
    setError('');
    setConfirmation(null);
    try {
      const order = await placeOrder({
        instrumentType: 'STOCK',
        instrumentId: ticker,
        orderType,
        side,
        quantity: qty,
        limitPrice: orderType === 'LIMIT' ? Number(limitPrice ?? stock.price) : null,
        expiresAt: null,
      });
      setConfirmation(order);
    } catch (e) {
      const msg = e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Order failed.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Trade" subtitle="Place orders on the Wakibi exchange" balance={eurAvail}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 18 }}>
        {/* Left: market info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding={22}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: D.surface3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14, color: D.ink, letterSpacing: 0.2,
                }}>{stock.ticker.slice(0, 4)}</div>
                <div>
                  <select value={ticker} onChange={(e) => setTicker(e.target.value)} style={{
                    background: 'transparent', border: 'none',
                    fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 22, color: D.ink, letterSpacing: '-0.01em',
                    cursor: 'pointer', appearance: 'none', paddingRight: 24,
                  }}>
                    {STOCKS.map(s => <option key={s.ticker} value={s.ticker} style={{ background: D.surface2, color: D.ink }}>{s.ticker}</option>)}
                  </select>
                  <div style={{ fontSize: 13, color: D.ink50, marginTop: 2 }}>{stock.name} · {stock.sector}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Money value={stock.price} currency="EUR" big/>
                <div style={{ marginTop: 4 }}><Delta value={stock.change} pct={stock.changePct}/></div>
              </div>
            </div>

            <div style={{ marginLeft: -8, marginRight: -8 }}>
              <AreaChart data={series} height={140} color={stock.changePct >= 0 ? D.sage : D.sell}/>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 18, paddingTop: 18, borderTop: `1px solid ${D.hairline}` }}>
              <KPI label="Bid" value={`€${(stock.price - 0.05).toFixed(2)}`}/>
              <KPI label="Ask" value={`€${(stock.price + 0.05).toFixed(2)}`}/>
              <KPI label="Volume" value={`${(stock.volume / 1000).toFixed(1)}k`}/>
              <KPI label="Volatility" value={`${(stock.volatility * 100).toFixed(1)}%`}/>
            </div>
          </Card>

          <Card padding={0} style={{ flex: 1 }}>
            <div style={{ padding: '16px 22px', borderBottom: `1px solid ${D.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15, color: D.ink, letterSpacing: '-0.01em' }}>Time & sales</div>
                <div style={{ fontSize: 11.5, color: D.ink50, marginTop: 2 }}>Last 10 matched trades on {ticker}</div>
              </div>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: D.spring }}>
                <span style={{ width: 6, height: 6, borderRadius: 3, background: D.spring, boxShadow: `0 0 6px ${D.spring}` }}/>
                Live feed
              </span>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: '90px 1fr 1fr 80px',
              padding: '8px 22px',
              fontSize: 10.5, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600,
              borderBottom: `1px solid ${D.hairline}`,
            }}>
              <div>Time</div><div>Price</div><div>Qty</div><div style={{ textAlign: 'right' }}>Side</div>
            </div>
            {recentTrades.map((t, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '90px 1fr 1fr 80px',
                padding: '8px 22px', alignItems: 'center',
                fontFamily: FONT_BODY, fontSize: 12.5, fontVariantNumeric: 'tabular-nums',
                borderBottom: i === recentTrades.length - 1 ? 'none' : `1px solid ${D.hairline}`,
              }}>
                <div style={{ color: D.ink50 }}>{t.time}</div>
                <div style={{ color: t.side === 'BUY' ? D.buy : D.sell, fontWeight: 600 }}>€{t.price.toFixed(2)}</div>
                <div style={{ color: D.ink70 }}>{t.qty}</div>
                <div style={{ textAlign: 'right' }}>
                  <Pill color={t.side === 'BUY' ? D.buy : D.sell} bg={t.side === 'BUY' ? D.buyBg : D.sellBg}>{t.side}</Pill>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Right: order ticket */}
        <Card padding={0} style={{ alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 16, gap: 8 }}>
            <button onClick={() => setSide('BUY')} style={{
              padding: '12px',
              background: side === 'BUY' ? D.buy : 'transparent',
              border: `1px solid ${side === 'BUY' ? D.buy : D.hairline2}`,
              color: side === 'BUY' ? D.plumDeep : D.ink70,
              borderRadius: 10, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              letterSpacing: '-0.01em',
            }}>Buy</button>
            <button onClick={() => setSide('SELL')} style={{
              padding: '12px',
              background: side === 'SELL' ? D.sell : 'transparent',
              border: `1px solid ${side === 'SELL' ? D.sell : D.hairline2}`,
              color: side === 'SELL' ? '#fff' : D.ink70,
              borderRadius: 10, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14, cursor: 'pointer',
              letterSpacing: '-0.01em',
            }}>Sell</button>
          </div>

          <div style={{ padding: '0 16px 16px' }}>
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
                    if (side === 'BUY' && execPrice > 0) setQty(Math.floor(eurAvail / execPrice));
                    else if (side === 'SELL') setQty(ownedQty);
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
                  <span style={{ color: D.ink50, fontFamily: FONT_HEAD, fontWeight: 600 }}>€</span>
                  <input type="number" step="0.01" value={limitPrice ?? ''} placeholder={stock.price.toFixed(2)}
                    onChange={(e) => setLimitPrice(e.target.value ? +e.target.value : null)}
                    style={{
                      flex: 1, background: 'transparent', border: 'none', outline: 'none',
                      color: D.ink, fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 16, fontVariantNumeric: 'tabular-nums',
                    }}/>
                </div>
                <div style={{ marginBottom: 16, fontSize: 11, color: D.ink50 }}>
                  Mid <span style={{ color: D.ink70, fontVariantNumeric: 'tabular-nums' }}>€{stock.price.toFixed(2)}</span>
                  {' · '}Spread <span style={{ color: D.ink70 }}>€0.10</span>
                </div>

                <Label>Time in force</Label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 16 }}>
                  {[['GTC', 'Good ‘til cancel'], ['DAY', 'Day only'], ['IOC', 'Immediate']].map(([v, l]) => (
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

            <div style={{
              background: D.surface2, borderRadius: 12, padding: 14, marginTop: 4, marginBottom: 12,
              border: `1px solid ${D.hairline}`,
            }}>
              <SummaryRow label="Estimated price" value={orderType === 'MARKET' ? `€${stock.price.toFixed(2)} (mkt)` : `€${execPrice.toFixed(2)}`}/>
              <SummaryRow label="Subtotal" value={`€${(qty * execPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}/>
              <SummaryRow label="Platform fee · 0.08%" value={`€${fee.toFixed(2)}`} hint={<span style={{ color: D.spring }}>→ microloans</span>}/>
              <div style={{ height: 1, background: D.hairline, margin: '10px 0' }}/>
              <SummaryRow
                label={side === 'BUY' ? 'Total cost' : 'Net proceeds'}
                value={`€${(side === 'BUY' ? total : proceeds).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                bold
              />
            </div>

            {!canAfford && side === 'BUY' && (
              <div style={{ background: D.sellBg, color: D.sell, padding: '10px 12px', borderRadius: 9, fontSize: 12, marginBottom: 12, border: `1px solid ${D.sell}33` }}>
                ⚠ Insufficient funds. Available €{eurAvail.toFixed(2)}.
              </div>
            )}
            {!canSell && side === 'SELL' && (
              <div style={{ background: D.sellBg, color: D.sell, padding: '10px 12px', borderRadius: 9, fontSize: 12, marginBottom: 12, border: `1px solid ${D.sell}33` }}>
                ⚠ You hold {ownedQty} {ticker}. Cannot sell {qty}.
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
