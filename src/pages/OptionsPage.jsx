import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { D, FONT_HEAD, FONT_BODY } from '../theme/tokens';
import { AppShell } from '../components/shell/AppShell';
import { Card, Pill } from '../components/shared/dark-ui';
import { getOptions } from '../api/options';
import { placeOrder } from '../api/orders';
import { getMyHoldings } from '../api/holdings';
import { useAccount } from '../context/AccountContext';
import { useNotificationMessage } from '../context/NotificationsContext';
import { fromUSD, getRate } from '../data/exchangeRates';

const SYMBOLS = {
  EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ', RON: 'lei ',
};

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtMoney(n, currency = 'USD') {
  if (n == null) return '—';
  const sym = SYMBOLS[currency] || `${currency} `;
  return `${sym}${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtExpiry(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isExpired(iso) {
  if (!iso) return false;
  return new Date(iso) <= new Date();
}

function daysUntil(iso) {
  if (!iso) return null;
  const diff = new Date(iso) - new Date();
  return Math.ceil(diff / 86400000);
}

const Label = ({ children }) => (
  <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 6, fontFamily: FONT_BODY }}>
    {children}
  </div>
);

const SummaryRow = ({ label, value, bold }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontFamily: FONT_BODY }}>
    <div style={{ fontSize: 12.5, color: bold ? D.ink : D.ink70 }}>{label}</div>
    <div style={{ fontSize: bold ? 15 : 13, fontWeight: bold ? 700 : 600, color: D.ink, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
  </div>
);

const stepBtn = {
  width: 40, height: 40,
  background: D.surface2, border: `1px solid ${D.hairline}`,
  color: D.ink, fontSize: 18, cursor: 'pointer',
  fontFamily: FONT_HEAD, fontWeight: 600,
  borderTopLeftRadius: 9, borderBottomLeftRadius: 9,
};

// ── sub-components ────────────────────────────────────────────────────────────

const KPI = ({ label, value, tone }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 10, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 4 }}>{label}</div>
    <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15, color: tone || D.ink, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
  </div>
);

function ContractRow({ contract, selected, onClick }) {
  const expired = isExpired(contract.expiry_time ?? contract.expiryTime);
  const days = daysUntil(contract.expiry_time ?? contract.expiryTime);
  const isCall = (contract.option_type ?? contract.optionType) === 'CALL';
  const callColor = D.buy;
  const putColor  = D.sell;
  const typeColor = isCall ? callColor : putColor;

  return (
    <div onClick={onClick} style={{
      display: 'grid', gridTemplateColumns: '60px 70px 1fr 90px 80px',
      padding: '13px 18px', alignItems: 'center', gap: 8,
      cursor: 'pointer',
      background: selected ? D.surface3 : 'transparent',
      borderLeft: `3px solid ${selected ? typeColor : 'transparent'}`,
      borderBottom: `1px solid ${D.hairline}`,
      opacity: expired ? 0.45 : 1,
      fontFamily: FONT_BODY,
    }}>
      <div>
        <span style={{
          padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700,
          background: isCall ? `${D.buy}22` : `${D.sell}22`,
          color: typeColor,
        }}>{isCall ? 'CALL' : 'PUT'}</span>
      </div>
      <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13, color: D.ink }}>
        {contract.underlying_ticker ?? contract.underlyingTicker}
      </div>
      <div style={{ fontSize: 12, color: D.ink70, fontVariantNumeric: 'tabular-nums' }}>
        Strike <span style={{ color: D.ink, fontWeight: 600 }}>${Number(contract.strike_price ?? contract.strikePrice).toFixed(2)}</span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13, color: D.sage, fontVariantNumeric: 'tabular-nums' }}>
          ${Number(contract.premium).toFixed(2)}
        </div>
        <div style={{ fontSize: 10, color: D.ink50 }}>premium</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: expired ? D.sell : days <= 3 ? D.warn : D.ink50 }}>
          {expired ? 'Expired' : `${days}d left`}
        </div>
        <div style={{ fontSize: 10, color: D.ink50 }}>{fmtExpiry(contract.expiry_time ?? contract.expiryTime)}</div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function OptionsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('ALL');   // ALL | CALL | PUT
  const [underlying, setUnderlying] = useState('ALL');
  const [holdings, setHoldings] = useState([]);

  const [side, setSide] = useState('BUY');
  const [qty, setQty] = useState(1);
  const [orderType, setOrderType] = useState('MARKET');
  const [limitPrice, setLimitPrice] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');

  const pickerRef = useRef(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { accounts, activeId, setActiveId, activeAccount } = useAccount();

  const fetchHoldings = useCallback(() => {
    getMyHoldings().then(h => setHoldings(h || [])).catch(() => {});
  }, []);

  useEffect(() => {
    getOptions()
      .then(data => {
        setContracts(data);
        if (data.length > 0) setSelected(data[0].option_id ?? data[0].optionId);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchHoldings(); }, [fetchHoldings, confirmation]);

  useNotificationMessage((msg) => {
    if (msg?.type === 'ORDER_UPDATE') fetchHoldings();
  });

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const underlyings = useMemo(() => {
    const tickers = [...new Set(contracts.map(c => c.underlying_ticker ?? c.underlyingTicker))].sort();
    return ['ALL', ...tickers];
  }, [contracts]);

  const filtered = useMemo(() => contracts.filter(c => {
    const type = c.option_type ?? c.optionType;
    const ticker = c.underlying_ticker ?? c.underlyingTicker;
    if (filter !== 'ALL' && type !== filter) return false;
    if (underlying !== 'ALL' && ticker !== underlying) return false;
    return true;
  }), [contracts, filter, underlying]);

  const contract = contracts.find(c => (c.option_id ?? c.optionId) === selected) ?? filtered[0] ?? null;

  const activeCurrency = activeAccount?.currency || 'USD';
  const activeSym = SYMBOLS[activeCurrency] || `${activeCurrency} `;
  const availBalance = Number(activeAccount?.balance || 0);
  const needsConversion = activeCurrency !== 'USD';
  const fxRate = getRate(activeCurrency);

  const premium = contract ? Number(contract.premium) : 0;
  const execPrice = orderType === 'MARKET' ? premium : (limitPrice ?? premium);
  const fee = Math.max(1.0, qty * execPrice * 0.0008);
  const totalUSD = qty * execPrice + (side === 'BUY' ? fee : -fee);
  const totalInAccountCurrency = needsConversion ? fromUSD(totalUSD, activeCurrency) : totalUSD;
  const feeInAccountCurrency = needsConversion ? fromUSD(fee, activeCurrency) : fee;

  const holding = contract
    ? holdings.find(h => (h.instrumentId || h.ticker) === (contract.option_id ?? contract.optionId) && (h.instrumentType || h.type) === 'OPTION')
    : null;
  const ownedQty = Number(holding?.amount || 0);

  const canAfford = side === 'BUY' ? totalInAccountCurrency <= availBalance : true;
  const canSell   = side === 'SELL' ? qty <= ownedQty : true;
  const valid = qty > 0 && canAfford && canSell && !!contract && !isExpired(contract?.expiry_time ?? contract?.expiryTime);

  const isCall = contract ? (contract.option_type ?? contract.optionType) === 'CALL' : true;
  const days = contract ? daysUntil(contract.expiry_time ?? contract.expiryTime) : null;

  async function submit() {
    if (!contract) return;
    setSubmitting(true); setError(''); setConfirmation(null);
    try {
      const result = await placeOrder({
        instrumentType: 'OPTION',
        instrumentId: contract.option_id ?? contract.optionId,
        orderType,
        side,
        quantity: qty,
        limitPrice: orderType === 'LIMIT' ? Number(limitPrice ?? premium) : null,
        expiresAt: null,
        currency: activeCurrency,
      });
      setConfirmation(result);
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || 'Order could not be placed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Options" subtitle="Loading…">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: D.ink50, fontSize: 14 }}>
          Fetching option contracts…
        </div>
      </AppShell>
    );
  }

  if (contracts.length === 0) {
    return (
      <AppShell title="Options" subtitle="No active contracts">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400, color: D.ink50, fontSize: 14 }}>
          No active option contracts available. Check back when the market is open.
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Options" subtitle="Trade CALL & PUT contracts on the exchange">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 18 }}>

        {/* Left: contract browser */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Selected contract detail card */}
          {contract && (
            <Card padding={22}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: isCall ? `${D.buy}22` : `${D.sell}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13,
                    color: isCall ? D.buy : D.sell,
                  }}>{isCall ? 'C' : 'P'}</div>
                  <div>
                    <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 22, color: D.ink, letterSpacing: '-0.01em' }}>
                      {contract.underlying_ticker ?? contract.underlyingTicker}
                      {' '}
                      <span style={{ color: isCall ? D.buy : D.sell }}>{isCall ? 'CALL' : 'PUT'}</span>
                    </div>
                    <div style={{ fontSize: 13, color: D.ink50, marginTop: 2 }}>
                      Strike ${Number(contract.strike_price ?? contract.strikePrice).toFixed(2)} · Expires {fmtExpiry(contract.expiry_time ?? contract.expiryTime)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 28, color: D.sage, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                    ${Number(contract.premium).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 12, color: D.ink50, marginTop: 2 }}>premium / contract</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, paddingTop: 18, borderTop: `1px solid ${D.hairline}` }}>
                <KPI label="Type"   value={isCall ? 'CALL' : 'PUT'} tone={isCall ? D.buy : D.sell}/>
                <KPI label="Strike" value={`$${Number(contract.strike_price ?? contract.strikePrice).toFixed(2)}`}/>
                <KPI label="Expiry" value={fmtExpiry(contract.expiry_time ?? contract.expiryTime)} tone={days != null && days <= 3 ? D.warn : undefined}/>
                <KPI label="Days left" value={days != null ? (days <= 0 ? 'Expired' : `${days}d`) : '—'} tone={days != null && days <= 3 ? D.warn : undefined}/>
              </div>

              {/* What the contract means */}
              <div style={{ marginTop: 16, padding: '12px 16px', background: D.surface3, borderRadius: 10, fontSize: 12.5, color: D.ink70, lineHeight: 1.6 }}>
                {isCall
                  ? `A CALL option gives you the right to buy ${contract.underlying_ticker ?? contract.underlyingTicker} at $${Number(contract.strike_price ?? contract.strikePrice).toFixed(2)} before expiry. It gains value when the underlying rises above the strike.`
                  : `A PUT option gives you the right to sell ${contract.underlying_ticker ?? contract.underlyingTicker} at $${Number(contract.strike_price ?? contract.strikePrice).toFixed(2)} before expiry. It gains value when the underlying falls below the strike.`
                }
                {contract.auto_exercise ?? contract.autoExercise
                  ? ' Auto-exercise is enabled — contracts are settled automatically at expiry.'
                  : ''}
              </div>
            </Card>
          )}

          {/* Contract list */}
          <Card padding={0}>
            {/* Filter bar */}
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${D.hairline}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {['ALL', 'CALL', 'PUT'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '5px 12px',
                    background: filter === f ? D.surface3 : 'transparent',
                    border: `1px solid ${filter === f ? D.hairline2 : D.hairline}`,
                    color: filter === f
                      ? (f === 'CALL' ? D.buy : f === 'PUT' ? D.sell : D.ink)
                      : D.ink50,
                    borderRadius: 7, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11.5, cursor: 'pointer',
                  }}>{f}</button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {underlyings.map(t => (
                  <button key={t} onClick={() => setUnderlying(t)} style={{
                    padding: '5px 10px',
                    background: underlying === t ? D.surface3 : 'transparent',
                    border: `1px solid ${underlying === t ? D.hairline2 : D.hairline}`,
                    color: underlying === t ? D.ink : D.ink50,
                    borderRadius: 7, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 11, cursor: 'pointer',
                  }}>{t}</button>
                ))}
              </div>
              <div style={{ marginLeft: 'auto', fontSize: 11, color: D.ink50 }}>
                {filtered.length} contract{filtered.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '60px 70px 1fr 90px 80px',
              padding: '8px 18px',
              fontSize: 10, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600,
              borderBottom: `1px solid ${D.hairline}`,
            }}>
              <div>Type</div><div>Ticker</div><div>Strike</div>
              <div style={{ textAlign: 'right' }}>Premium</div>
              <div style={{ textAlign: 'right' }}>Expiry</div>
            </div>

            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '28px', textAlign: 'center', color: D.ink50, fontSize: 13 }}>
                  No contracts match the selected filters.
                </div>
              ) : filtered.map(c => (
                <ContractRow
                  key={c.option_id ?? c.optionId}
                  contract={c}
                  selected={(c.option_id ?? c.optionId) === selected}
                  onClick={() => {
                    setSelected(c.option_id ?? c.optionId);
                    setConfirmation(null); setError('');
                  }}
                />
              ))}
            </div>
          </Card>
        </div>

        {/* Right: order ticket */}
        <Card padding={0} style={{ alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
          {!contract ? (
            <div style={{ padding: 32, color: D.ink50, fontSize: 13, textAlign: 'center' }}>
              Select a contract to place an order.
            </div>
          ) : (
            <>
              {/* Buy / Sell toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: 16, gap: 8 }}>
                <button onClick={() => setSide('BUY')} style={{
                  padding: '12px',
                  background: side === 'BUY' ? D.buy : 'transparent',
                  border: `1px solid ${side === 'BUY' ? D.buy : D.hairline2}`,
                  color: side === 'BUY' ? D.plumDeep : D.ink70,
                  borderRadius: 10, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}>Buy</button>
                <button onClick={() => setSide('SELL')} style={{
                  padding: '12px',
                  background: side === 'SELL' ? D.sell : 'transparent',
                  border: `1px solid ${side === 'SELL' ? D.sell : D.hairline2}`,
                  color: side === 'SELL' ? '#fff' : D.ink70,
                  borderRadius: 10, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                }}>Sell</button>
              </div>

              <div style={{ padding: '0 16px 16px' }}>
                {/* Account picker */}
                <Label>Funding account</Label>
                <div ref={pickerRef} style={{ position: 'relative', marginBottom: 16 }}>
                  <button onClick={() => setPickerOpen(o => !o)} style={{
                    width: '100%', textAlign: 'left', cursor: 'pointer',
                    background: D.surface2, border: `1px solid ${pickerOpen ? D.sage : D.hairline}`,
                    borderRadius: pickerOpen ? '9px 9px 0 0' : 9, padding: '10px 12px',
                    display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY,
                  }}>
                    <div style={{ background: D.sageBg, borderRadius: 6, padding: '3px 8px', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12, color: D.sage }}>{activeCurrency}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: D.ink, fontVariantNumeric: 'tabular-nums' }}>
                        {activeSym}{availBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div style={{ fontSize: 11, color: D.ink50, marginTop: 1 }}>Available</div>
                    </div>
                    <span style={{ color: D.ink50, fontSize: 11, transform: pickerOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                  </button>
                  {pickerOpen && (
                    <div style={{
                      position: 'absolute', left: 0, right: 0, zIndex: 50,
                      background: D.surface2, border: `1px solid ${D.sage}`,
                      borderTop: 'none', borderRadius: '0 0 9px 9px', overflow: 'hidden',
                    }}>
                      {accounts.map((a, i) => {
                        const isSel = String(a.accountId) === String(activeId);
                        const sym = SYMBOLS[a.currency] || `${a.currency} `;
                        return (
                          <button key={a.accountId} onClick={() => { setActiveId(a.accountId); setPickerOpen(false); }} style={{
                            width: '100%', textAlign: 'left', cursor: 'pointer',
                            background: isSel ? D.sageBg : 'transparent',
                            border: 'none', borderBottom: i < accounts.length - 1 ? `1px solid ${D.hairline}` : 'none',
                            padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY,
                          }}>
                            <div style={{ background: isSel ? D.sageBg : D.surface3, borderRadius: 6, padding: '3px 8px', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12, color: isSel ? D.sage : D.ink50 }}>{a.currency}</div>
                            <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: D.ink, fontVariantNumeric: 'tabular-nums' }}>
                              {sym}{Number(a.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            {isSel && <span style={{ color: D.sage }}>✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Order type */}
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

                {/* Quantity */}
                <Label>Contracts</Label>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                  <button onClick={() => setQty(Math.max(1, qty - 1))} style={stepBtn}>−</button>
                  <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, +e.target.value))} style={{
                    flex: 1, padding: '10px 12px',
                    background: D.surface2, border: `1px solid ${D.hairline}`, borderLeft: 'none', borderRight: 'none',
                    color: D.ink, fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 18,
                    outline: 'none', textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                  }}/>
                  <button onClick={() => setQty(qty + 1)} style={{ ...stepBtn, borderRadius: 0, borderTopRightRadius: 9, borderBottomRightRadius: 9, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}>+</button>
                </div>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[1, 5, 10, 25].map(v => (
                    <button key={v} onClick={() => setQty(v)} style={{
                      flex: 1, padding: '5px', background: 'transparent', border: `1px solid ${D.hairline}`,
                      color: D.ink70, borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY,
                    }}>{v}</button>
                  ))}
                </div>

                {/* Limit price */}
                {orderType === 'LIMIT' && (
                  <>
                    <Label>Limit price (USD)</Label>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: D.surface2, border: `1px solid ${D.hairline}`,
                      borderRadius: 9, padding: '10px 12px', marginBottom: 16,
                    }}>
                      <span style={{ color: D.ink50, fontFamily: FONT_HEAD, fontWeight: 600 }}>$</span>
                      <input type="number" step="0.01" value={limitPrice ?? ''} placeholder={premium.toFixed(2)}
                        onChange={e => setLimitPrice(e.target.value ? +e.target.value : null)}
                        style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: D.ink, fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}
                      />
                    </div>
                  </>
                )}

                {/* Summary */}
                <div style={{ background: D.surface2, borderRadius: 12, padding: 14, marginBottom: 12, border: `1px solid ${D.hairline}` }}>
                  <SummaryRow label={`${activeCurrency} available`} value={`${activeSym}${availBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}/>
                  {side === 'SELL' && <SummaryRow label="Contracts held" value={ownedQty}/>}
                  <div style={{ height: 1, background: D.hairline, margin: '8px 0' }}/>
                  <SummaryRow label="Premium / contract" value={`$${execPrice.toFixed(2)}`}/>
                  <SummaryRow label="Contracts" value={qty}/>
                  <SummaryRow label="Subtotal" value={`$${(qty * execPrice).toFixed(2)}`}/>
                  <SummaryRow label="Platform fee · 0.08%" value={needsConversion
                    ? `${activeSym}${feeInAccountCurrency.toFixed(2)}`
                    : `$${fee.toFixed(2)}`}
                  />
                  {needsConversion && (
                    <SummaryRow label="FX rate" value={`1 USD = ${fxRate.toFixed(4)} ${activeCurrency}`}/>
                  )}
                  <div style={{ height: 1, background: D.hairline, margin: '8px 0' }}/>
                  <SummaryRow
                    label={side === 'BUY' ? 'Total cost' : 'Net proceeds'}
                    value={`${activeSym}${totalInAccountCurrency.toFixed(2)}${needsConversion ? ` ${activeCurrency}` : ''}`}
                    bold
                  />
                </div>

                {/* Warnings */}
                {isExpired(contract.expiry_time ?? contract.expiryTime) && (
                  <div style={{ background: D.sellBg, color: D.sell, padding: '10px 12px', borderRadius: 9, fontSize: 12, marginBottom: 12, border: `1px solid ${D.sell}33` }}>
                    ⚠ This contract has expired and cannot be traded.
                  </div>
                )}
                {!canAfford && side === 'BUY' && (
                  <div style={{ background: D.sellBg, color: D.sell, padding: '10px 12px', borderRadius: 9, fontSize: 12, marginBottom: 12, border: `1px solid ${D.sell}33` }}>
                    ⚠ Insufficient funds. Need {activeSym}{totalInAccountCurrency.toFixed(2)} {activeCurrency}.
                  </div>
                )}
                {!canSell && side === 'SELL' && (
                  <div style={{ background: D.sellBg, color: D.sell, padding: '10px 12px', borderRadius: 9, fontSize: 12, marginBottom: 12, border: `1px solid ${D.sell}33` }}>
                    ⚠ You hold {ownedQty} contract{ownedQty !== 1 ? 's' : ''}. Cannot sell {qty}.
                  </div>
                )}
                {error && (
                  <div style={{ background: D.sellBg, color: D.sell, padding: '10px 12px', borderRadius: 9, fontSize: 12, marginBottom: 12, border: `1px solid ${D.sell}33` }}>
                    ⚠ {error}
                  </div>
                )}
                {confirmation && (
                  <div style={{ background: D.sageBg, color: D.sage, padding: '10px 12px', borderRadius: 9, fontSize: 12, marginBottom: 12, border: `1px solid ${D.sage}33` }}>
                    ✓ Order placed · {confirmation.status || 'PENDING'}
                  </div>
                )}

                {/* Submit */}
                <button disabled={!valid || submitting} onClick={submit} style={{
                  width: '100%', padding: '14px',
                  background: !valid ? D.surface3 : (side === 'BUY' ? D.buy : D.sell),
                  border: 'none',
                  color: !valid ? D.ink50 : (side === 'BUY' ? D.plumDeep : '#fff'),
                  borderRadius: 11, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14,
                  cursor: valid && !submitting ? 'pointer' : 'not-allowed',
                }}>
                  {submitting ? 'Submitting…' : `Place ${side === 'BUY' ? 'buy' : 'sell'} order`}
                </button>

                <div style={{ marginTop: 10, fontSize: 11, color: D.ink50, textAlign: 'center', lineHeight: 1.5 }}>
                  Options carry significant risk. You may lose your entire premium.
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── My Positions ─────────────────────────────────────────────────── */}
      {(() => {
        const optionHoldings = (holdings || []).filter(h =>
          (h.instrumentType || h.type) === 'OPTION' && Number(h.amount || 0) > 0
        );
        if (optionHoldings.length === 0) return null;
        return (
          <Card padding={0} style={{ marginTop: 18 }}>
            <div style={{ padding: '16px 22px 12px', borderBottom: `1px solid ${D.hairline}`, display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, color: D.ink, letterSpacing: '-0.01em' }}>My Positions</div>
              <div style={{ fontSize: 12, color: D.ink50 }}>{optionHoldings.length} open contract{optionHoldings.length !== 1 ? 's' : ''}</div>
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '60px 70px 1fr 90px 80px 100px 80px',
              padding: '8px 22px',
              fontSize: 10, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600,
              borderBottom: `1px solid ${D.hairline}`,
            }}>
              <div>Type</div><div>Ticker</div><div>Strike</div>
              <div style={{ textAlign: 'right' }}>Qty</div>
              <div style={{ textAlign: 'right' }}>Avg cost</div>
              <div style={{ textAlign: 'right' }}>Curr. premium</div>
              <div style={{ textAlign: 'right' }}>Expiry</div>
            </div>

            {optionHoldings.map((h, i) => {
              const id = h.instrumentId || h.ticker;
              const meta = contracts.find(c => (c.option_id ?? c.optionId) === id);
              const isC = (meta?.option_type ?? meta?.optionType) === 'CALL';
              const typeColor = isC ? D.buy : D.sell;
              const avgCost = Number(h.averageCost ?? h.avgCost ?? 0);
              const currentPremium = meta ? Number(meta.premium) : null;
              const pnl = currentPremium != null ? (currentPremium - avgCost) * Number(h.amount) : null;
              const expired = meta ? isExpired(meta.expiry_time ?? meta.expiryTime) : false;
              const days = meta ? daysUntil(meta.expiry_time ?? meta.expiryTime) : null;

              return (
                <div
                  key={id}
                  onClick={() => { setSelected(id); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{
                    display: 'grid', gridTemplateColumns: '60px 70px 1fr 90px 80px 100px 80px',
                    padding: '13px 22px', alignItems: 'center', gap: 8,
                    borderBottom: i === optionHoldings.length - 1 ? 'none' : `1px solid ${D.hairline}`,
                    fontFamily: FONT_BODY, fontSize: 13,
                    opacity: expired ? 0.5 : 1,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 700,
                      background: isC ? `${D.buy}22` : `${D.sell}22`, color: typeColor,
                    }}>{meta ? (isC ? 'CALL' : 'PUT') : '—'}</span>
                  </div>
                  <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, color: D.ink }}>
                    {meta?.underlying_ticker ?? meta?.underlyingTicker ?? id.slice(0, 6)}
                  </div>
                  <div style={{ color: D.ink70, fontVariantNumeric: 'tabular-nums' }}>
                    {meta ? `$${Number(meta.strike_price ?? meta.strikePrice).toFixed(2)}` : '—'}
                  </div>
                  <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                    {Number(h.amount)}
                  </div>
                  <div style={{ textAlign: 'right', color: D.ink70, fontVariantNumeric: 'tabular-nums' }}>
                    ${avgCost.toFixed(2)}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {currentPremium != null ? (
                      <>
                        <div style={{ fontVariantNumeric: 'tabular-nums', color: D.ink }}>${currentPremium.toFixed(2)}</div>
                        {pnl != null && (
                          <div style={{ fontSize: 11, color: pnl >= 0 ? D.buy : D.sell, fontVariantNumeric: 'tabular-nums' }}>
                            {pnl >= 0 ? '+' : '−'}${Math.abs(pnl).toFixed(2)}
                          </div>
                        )}
                      </>
                    ) : <span style={{ color: D.ink50 }}>—</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, color: expired ? D.sell : days != null && days <= 3 ? D.warn : D.ink50 }}>
                      {expired ? 'Expired' : days != null ? `${days}d` : '—'}
                    </div>
                    {meta && <div style={{ fontSize: 10, color: D.ink50 }}>{fmtExpiry(meta.expiry_time ?? meta.expiryTime)}</div>}
                  </div>
                </div>
              );
            })}
          </Card>
        );
      })()}

    </AppShell>
  );
}
