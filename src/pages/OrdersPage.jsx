import React, { useState } from 'react';
import { D, FONT_HEAD, FONT_BODY } from '../theme/tokens';
import { AppShell } from '../components/shell/AppShell';
import { Card, Pill } from '../components/shared/dark-ui';
import { STOCKS } from '../data/mockMarket';
import { ACCOUNTS } from '../data/mockAccounts';
import { ORDERS, STATUS_TONE } from '../data/mockOrders';

const KPIcard = ({ label, value, sub, tone }) => (
  <Card padding={20}>
    <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>{label}</div>
    <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 28, color: tone || D.ink, marginTop: 8, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    <div style={{ fontSize: 12, color: D.ink50, marginTop: 4 }}>{sub}</div>
  </Card>
);

const DetailRow = ({ label, value, bold }) => (
  <div>
    <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 3 }}>{label}</div>
    <div style={{ fontFamily: FONT_HEAD, fontWeight: bold ? 700 : 600, fontSize: bold ? 16 : 14, color: bold ? D.sage : D.ink, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
  </div>
);

function OrderDetail({ order }) {
  const stock = STOCKS.find(s => s.ticker === order.ticker);
  const tone = STATUS_TONE[order.status];
  const fillPct = (order.filled / order.qty) * 100;
  const isOpen = ['PENDING', 'PARTIAL'].includes(order.status);
  const total = order.qty * order.price;
  const fee = Math.max(1, total * 0.0008);

  const fills = order.filled > 0 ? [
    { qty: Math.floor(order.filled * 0.6), price: order.price - 0.05, time: '14:32:08' },
    { qty: order.filled - Math.floor(order.filled * 0.6), price: order.price, time: '14:32:14' },
  ] : [];

  return (
    <>
      <div style={{ padding: '20px 22px', borderBottom: `1px solid ${D.hairline}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Pill color={tone.color} bg={tone.bg} size="md">● {tone.label}</Pill>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: D.ink50 }}>{order.id}</span>
        </div>
        <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 22, color: D.ink, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 6,
            background: order.side === 'BUY' ? D.buyBg : D.sellBg,
            color: order.side === 'BUY' ? D.buy : D.sell,
            fontSize: 13, fontWeight: 700,
          }}>{order.side}</span>
          {order.qty} {order.ticker}
        </div>
        <div style={{ fontSize: 12.5, color: D.ink50, marginTop: 4 }}>
          {stock?.name} · placed {new Date(order.placedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${D.hairline}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Fill progress</span>
          <span style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14, color: D.ink, fontVariantNumeric: 'tabular-nums' }}>
            {order.filled}/{order.qty} <span style={{ color: D.ink50, fontWeight: 400 }}>({fillPct.toFixed(0)}%)</span>
          </span>
        </div>
        <div style={{ height: 8, background: D.surface2, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ width: fillPct + '%', height: '100%', background: order.status === 'FILLED' ? D.sage : D.warn, transition: 'width .3s' }}/>
        </div>
      </div>

      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${D.hairline}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <DetailRow label="Order type" value={order.type === 'MARKET' ? 'Market' : 'Limit'}/>
        <DetailRow label="Time in force" value={order.tif}/>
        <DetailRow label="Price" value={`€${order.price.toFixed(2)}`}/>
        <DetailRow label="Subtotal" value={`€${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}/>
        <DetailRow label="Platform fee" value={`€${fee.toFixed(2)}`}/>
        <DetailRow label={order.side === 'BUY' ? 'Frozen funds' : 'Net proceeds'} value={`€${(total + (order.side === 'BUY' ? fee : -fee)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} bold/>
      </div>

      {fills.length > 0 && (
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${D.hairline}` }}>
          <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 10 }}>Fills</div>
          {fills.map((f, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12.5, fontFamily: FONT_BODY, fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ color: D.ink50 }}>{f.time}</span>
              <span style={{ color: D.ink70 }}>{f.qty} @ €{f.price.toFixed(2)}</span>
              <span style={{ color: D.ink, fontWeight: 600 }}>€{(f.qty * f.price).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ padding: '18px 22px', display: 'flex', gap: 8 }}>
        {isOpen ? (
          <>
            <button style={{
              flex: 1, padding: '11px',
              background: D.sellBg, color: D.sell, border: `1px solid ${D.sell}55`,
              borderRadius: 9, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>Cancel order</button>
            <button style={{
              flex: 1, padding: '11px',
              background: 'transparent', color: D.ink, border: `1px solid ${D.hairline2}`,
              borderRadius: 9, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, cursor: 'pointer',
            }}>Modify</button>
          </>
        ) : (
          <>
            <button style={{
              flex: 1, padding: '11px',
              background: D.sage, color: D.plumDeep, border: 'none',
              borderRadius: 9, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}>Trade {order.ticker} again</button>
            <button style={{
              padding: '11px 14px',
              background: 'transparent', color: D.ink70, border: `1px solid ${D.hairline2}`,
              borderRadius: 9, fontFamily: FONT_BODY, fontWeight: 500, fontSize: 13, cursor: 'pointer',
            }}>Receipt</button>
          </>
        )}
      </div>
    </>
  );
}

export default function OrdersPage() {
  const [tab, setTab] = useState('open');
  const [selected, setSelected] = useState('ord-3501');
  const [side, setSide] = useState('all');

  const eurBalance = ACCOUNTS.find(a => a.currency === 'EUR').balance;

  const filtered = ORDERS.filter(o => {
    if (tab === 'open' && !['PENDING', 'PARTIAL'].includes(o.status)) return false;
    if (tab === 'closed' && ['PENDING', 'PARTIAL'].includes(o.status)) return false;
    if (side !== 'all' && o.side !== side.toUpperCase()) return false;
    return true;
  });

  const order = ORDERS.find(o => o.id === selected) || filtered[0];

  const counts = {
    open:   ORDERS.filter(o => ['PENDING', 'PARTIAL'].includes(o.status)).length,
    closed: ORDERS.filter(o => !['PENDING', 'PARTIAL'].includes(o.status)).length,
    all:    ORDERS.length,
  };

  return (
    <AppShell title="Orders" subtitle="Open positions, fills & history" balance={eurBalance}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        <KPIcard label="Open orders"   value={counts.open}   sub="3 partially filled" tone={D.warn}/>
        <KPIcard label="Filled today"  value="2"             sub="Total €5,983"       tone={D.sage}/>
        <KPIcard label="Funds frozen"  value="€1,240.00"     sub="Across 2 orders"    tone={D.ink}/>
        <KPIcard label="Cancel ratio"  value="8.4%"          sub="30-day rolling"     tone={D.ink70}/>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
        <Card padding={0}>
          <div style={{ padding: '14px 22px', borderBottom: `1px solid ${D.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[['open', `Open · ${counts.open}`], ['closed', `History · ${counts.closed}`], ['all', `All · ${counts.all}`]].map(([id, l]) => (
                <button key={id} onClick={() => setTab(id)} style={{
                  background: tab === id ? D.surface3 : 'transparent', border: 'none',
                  color: tab === id ? D.ink : D.ink50,
                  padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: FONT_BODY,
                }}>{l}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'buy', 'sell'].map(s => (
                <button key={s} onClick={() => setSide(s)} style={{
                  background: side === s ? D.surface3 : 'transparent',
                  border: `1px solid ${side === s ? D.hairline2 : D.hairline}`,
                  color: side === s ? (s === 'buy' ? D.buy : s === 'sell' ? D.sell : D.ink) : D.ink70,
                  padding: '5px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                  fontFamily: FONT_BODY, textTransform: 'capitalize',
                }}>{s}</button>
              ))}
            </div>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '120px 1fr 1fr 110px 1fr 110px',
            padding: '10px 22px', alignItems: 'center',
            fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600,
            borderBottom: `1px solid ${D.hairline}`,
          }}>
            <div>Order ID</div><div>Asset</div><div>Type</div>
            <div style={{ textAlign: 'right' }}>Qty</div><div>Status</div>
            <div style={{ textAlign: 'right' }}>Total</div>
          </div>

          <div style={{ maxHeight: 520, overflow: 'auto' }}>
            {filtered.map(o => {
              const stock = STOCKS.find(s => s.ticker === o.ticker);
              const tone = STATUS_TONE[o.status];
              const sel = o.id === selected;
              const fillPct = (o.filled / o.qty) * 100;
              const total = o.qty * o.price;
              return (
                <div key={o.id} onClick={() => setSelected(o.id)} style={{
                  display: 'grid', gridTemplateColumns: '120px 1fr 1fr 110px 1fr 110px',
                  padding: '14px 22px', alignItems: 'center', gap: 8,
                  cursor: 'pointer',
                  background: sel ? D.surface3 : 'transparent',
                  borderLeft: sel ? `3px solid ${o.side === 'BUY' ? D.buy : D.sell}` : '3px solid transparent',
                  borderBottom: `1px solid ${D.hairline}`,
                  fontFamily: FONT_BODY, fontSize: 13,
                }}>
                  <div style={{ fontFamily: 'ui-monospace, "SF Mono", monospace', fontSize: 11.5, color: D.ink50 }}>{o.id}</div>
                  <div>
                    <div style={{ fontWeight: 600, color: D.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: o.side === 'BUY' ? D.buy : D.sell }}/>
                      {o.ticker}
                    </div>
                    <div style={{ fontSize: 11, color: D.ink50, marginTop: 1 }}>{stock?.name}</div>
                  </div>
                  <div>
                    <div style={{ color: D.ink70, fontSize: 12.5 }}>{o.side === 'BUY' ? 'Buy' : 'Sell'} · {o.type === 'MARKET' ? 'Market' : 'Limit'}</div>
                    <div style={{ fontSize: 11, color: D.ink50, marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>@ €{o.price.toFixed(2)} · {o.tif}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: D.ink, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{o.filled}/{o.qty}</div>
                    {fillPct > 0 && fillPct < 100 && (
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                        <div style={{ width: fillPct + '%', height: '100%', background: D.warn }}/>
                      </div>
                    )}
                  </div>
                  <div><Pill color={tone.color} bg={tone.bg}>{tone.label}</Pill></div>
                  <div style={{ textAlign: 'right', color: D.ink, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    €{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card padding={0}>
          {order && <OrderDetail order={order}/>}
        </Card>
      </div>
    </AppShell>
  );
}
