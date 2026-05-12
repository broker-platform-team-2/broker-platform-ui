import React, { useEffect, useState } from 'react';
import { D, FONT_HEAD, FONT_BODY } from '../theme/tokens';
import { AppShell } from '../components/shell/AppShell';
import { Card, Pill } from '../components/shared/dark-ui';
import { getMyTransactions } from '../api/transactions';

const STATUS_TONE = {
  PENDING:          { label: 'Pending',          color: D.warn,   bg: 'rgba(251,191,36,0.12)'  },
  PARTIALLY_FILLED: { label: 'Partial fill',     color: D.warn,   bg: 'rgba(251,191,36,0.12)'  },
  FILLED:           { label: 'Filled',            color: D.buy,    bg: 'rgba(74,222,128,0.12)'  },
  CANCELED:         { label: 'Cancelled',         color: D.ink50,  bg: 'rgba(255,255,255,0.06)' },
  EXPIRED:          { label: 'Expired',           color: D.ink50,  bg: 'rgba(255,255,255,0.06)' },
  REJECTED:         { label: 'Rejected',          color: D.sell,   bg: 'rgba(248,113,113,0.12)' },
};

const OPEN_STATUSES = new Set(['PENDING', 'PARTIALLY_FILLED']);

const KPIcard = ({ label, value, sub, tone }) => (
  <Card padding={20}>
    <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>{label}</div>
    <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 28, color: tone || D.ink, marginTop: 8, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    <div style={{ fontSize: 12, color: D.ink50, marginTop: 4 }}>{sub}</div>
  </Card>
);

const DetailRow = ({ label, value, tone }) => (
  <div>
    <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 3 }}>{label}</div>
    <div style={{ fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 14, color: tone || D.ink, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
  </div>
);

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function fmtMoney(n, currency = 'EUR') {
  if (n == null) return '—';
  return `${currency === 'EUR' ? '€' : currency}${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function OrderDetail({ tx }) {
  const tone = STATUS_TONE[tx.status] ?? { label: tx.status, color: D.ink50, bg: 'rgba(255,255,255,0.06)' };
  const total = Number(tx.price) * tx.quantity;
  const fee = Number(tx.platformFee ?? 0);
  const isOpen = OPEN_STATUSES.has(tx.status);

  return (
    <>
      <div style={{ padding: '20px 22px', borderBottom: `1px solid ${D.hairline}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Pill color={tone.color} bg={tone.bg} size="md">● {tone.label}</Pill>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, color: D.ink50 }}>
            #{tx.transactionId}
          </span>
        </div>
        <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 22, color: D.ink, letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 6,
            background: tx.type === 'BUY' ? D.buyBg : D.sellBg,
            color: tx.type === 'BUY' ? D.buy : D.sell,
            fontSize: 13, fontWeight: 700,
          }}>{tx.type}</span>
          {tx.quantity} shares
        </div>
        <div style={{ fontSize: 12.5, color: D.ink50, marginTop: 4 }}>
          {tx.currency} · placed {fmtDate(tx.date)}
        </div>
      </div>

      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${D.hairline}`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <DetailRow label="Price per share" value={fmtMoney(tx.price, tx.currency)}/>
        <DetailRow label="Quantity" value={tx.quantity}/>
        <DetailRow label="Subtotal" value={fmtMoney(total, tx.currency)}/>
        <DetailRow label="Platform fee" value={fmtMoney(fee, tx.currency)}/>
        <DetailRow
          label={tx.type === 'BUY' ? 'Total cost' : 'Net proceeds'}
          value={fmtMoney(tx.type === 'BUY' ? total + fee : total - fee, tx.currency)}
          tone={D.sage}
        />
        {tx.exchangeOrderId && (
          <DetailRow label="Exchange order" value={`#${tx.exchangeOrderId}`}/>
        )}
      </div>

      <div style={{ padding: '18px 22px', display: 'flex', gap: 8 }}>
        {isOpen ? (
          <div style={{ fontSize: 13, color: D.ink50, fontFamily: FONT_BODY }}>
            Order is active — cancel from the trading screen.
          </div>
        ) : (
          <a href="/trade" style={{
            display: 'block', flex: 1, padding: '11px', textAlign: 'center',
            background: D.sage, color: D.plumDeep, border: 'none',
            borderRadius: 9, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13,
            textDecoration: 'none',
          }}>Place new order</a>
        )}
      </div>
    </>
  );
}

export default function OrdersPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('open');
  const [selected, setSelected] = useState(null);
  const [side, setSide] = useState('all');

  useEffect(() => {
    getMyTransactions()
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setTransactions(list);
        if (list.length > 0) setSelected(list[0].transactionId);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toDateString();

  const openCount   = transactions.filter(t => OPEN_STATUSES.has(t.status)).length;
  const filledToday = transactions.filter(t => t.status === 'FILLED' && new Date(t.date).toDateString() === today);
  const totalFilled = filledToday.reduce((s, t) => s + Number(t.price) * t.quantity, 0);
  const totalFees   = transactions.reduce((s, t) => s + Number(t.platformFee ?? 0), 0);

  const filtered = transactions.filter(t => {
    if (tab === 'open'   && !OPEN_STATUSES.has(t.status)) return false;
    if (tab === 'closed' && OPEN_STATUSES.has(t.status))  return false;
    if (side === 'buy'   && t.type !== 'BUY')  return false;
    if (side === 'sell'  && t.type !== 'SELL') return false;
    return true;
  });

  const selectedTx = transactions.find(t => t.transactionId === selected) ?? filtered[0] ?? null;

  const counts = {
    open:   openCount,
    closed: transactions.length - openCount,
    all:    transactions.length,
  };

  if (loading) {
    return (
      <AppShell title="Orders" subtitle="Loading…">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 130px)', color: D.ink50, fontSize: 14 }}>
          Fetching your orders…
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Orders" subtitle="Open positions, fills & history">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 18 }}>
        <KPIcard label="Open orders"    value={counts.open}                         sub="pending & partial fills"  tone={counts.open > 0 ? D.warn : D.ink}/>
        <KPIcard label="Filled today"   value={filledToday.length}                  sub={filledToday.length > 0 ? `Total ${fmtMoney(totalFilled)}` : 'No fills yet'} tone={D.sage}/>
        <KPIcard label="Total orders"   value={counts.all}                          sub="all time"                 tone={D.ink}/>
        <KPIcard label="Platform fees"  value={fmtMoney(totalFees)}                 sub="all time total"           tone={D.ink70}/>
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
            display: 'grid', gridTemplateColumns: '90px 80px 1fr 90px 1fr 110px',
            padding: '10px 22px',
            fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600,
            borderBottom: `1px solid ${D.hairline}`,
          }}>
            <div>ID</div><div>Side</div><div>Qty · Price</div>
            <div style={{ textAlign: 'right' }}>Total</div><div>Status</div>
            <div style={{ textAlign: 'right' }}>Date</div>
          </div>

          <div style={{ maxHeight: 520, overflow: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '32px 22px', color: D.ink50, fontSize: 13, textAlign: 'center' }}>
                No orders here yet.
              </div>
            ) : filtered.map(tx => {
              const tone = STATUS_TONE[tx.status] ?? { label: tx.status, color: D.ink50, bg: 'rgba(255,255,255,0.06)' };
              const sel  = tx.transactionId === selected;
              const total = Number(tx.price) * tx.quantity;
              return (
                <div key={tx.transactionId} onClick={() => setSelected(tx.transactionId)} style={{
                  display: 'grid', gridTemplateColumns: '90px 80px 1fr 90px 1fr 110px',
                  padding: '14px 22px', alignItems: 'center', gap: 8,
                  cursor: 'pointer',
                  background: sel ? D.surface3 : 'transparent',
                  borderLeft: sel ? `3px solid ${tx.type === 'BUY' ? D.buy : D.sell}` : '3px solid transparent',
                  borderBottom: `1px solid ${D.hairline}`,
                  fontFamily: FONT_BODY, fontSize: 13,
                }}>
                  <div style={{ fontFamily: 'ui-monospace, "SF Mono", monospace', fontSize: 11, color: D.ink50 }}>#{tx.transactionId}</div>
                  <div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 5,
                      background: tx.type === 'BUY' ? D.buyBg : D.sellBg,
                      color: tx.type === 'BUY' ? D.buy : D.sell,
                      fontSize: 11.5, fontWeight: 700,
                    }}>{tx.type}</span>
                  </div>
                  <div style={{ color: D.ink70, fontVariantNumeric: 'tabular-nums' }}>
                    {tx.quantity} @ {fmtMoney(tx.price, tx.currency)}
                  </div>
                  <div style={{ textAlign: 'right', color: D.ink, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    {fmtMoney(total, tx.currency)}
                  </div>
                  <div><Pill color={tone.color} bg={tone.bg}>{tone.label}</Pill></div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: D.ink50 }}>{fmtDate(tx.date)}</div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card padding={0}>
          {selectedTx
            ? <OrderDetail tx={selectedTx}/>
            : <div style={{ padding: 32, color: D.ink50, fontSize: 13, textAlign: 'center' }}>Select an order to see details.</div>
          }
        </Card>
      </div>
    </AppShell>
  );
}