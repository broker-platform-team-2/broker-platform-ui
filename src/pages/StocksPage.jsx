import React, { useMemo, useState } from 'react';
import { D, FONT_HEAD, FONT_BODY } from '../theme/tokens';
import { AppShell } from '../components/shell/AppShell';
import { Card, Pill, Money, Delta, AreaChart, KPI, genSeries, genOrderBook, seedRand } from '../components/shared/dark-ui';
import { STOCKS, SECTORS } from '../data/mockMarket';

export default function StocksPage() {
  const [selected, setSelected] = useState('ZEDA');
  const [filter, setFilter] = useState('All');
  const [range, setRange] = useState('1M');

  const stock = STOCKS.find(s => s.ticker === selected);
  const sectors = ['All', ...SECTORS];
  const filtered = STOCKS.filter(s => filter === 'All' || s.sector === filter);

  const series = useMemo(() => genSeries(stock.ticker.charCodeAt(0) * 13, 80, stock.price * 0.85, stock.volatility), [stock.ticker, stock.price, stock.volatility]);
  const adjusted = useMemo(() => {
    const last = series[series.length - 1];
    const ratio = stock.price / last;
    return series.map(v => v * ratio);
  }, [series, stock.price]);

  const prediction = useMemo(() => {
    const last = adjusted[adjusted.length - 1];
    const trend = stock.changePct / 100;
    const r = seedRand(stock.ticker.charCodeAt(0));
    const out = [last];
    for (let i = 0; i < 18; i++) {
      const v = out[out.length - 1] * (1 + trend / 30 + (r() - 0.5) * stock.volatility * 0.4);
      out.push(v);
    }
    return out;
  }, [adjusted, stock]);

  const orderBook = useMemo(() => genOrderBook(stock.price, stock.ticker.charCodeAt(0) * 7), [stock.ticker, stock.price]);
  const maxQty = Math.max(...orderBook.bids.map(b => b.qty), ...orderBook.asks.map(a => a.qty));

  return (
    <AppShell title="Markets" subtitle={`Live · Wakibi Exchange · ${STOCKS.length} listed equities`}>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18, height: 'calc(100vh - 130px)' }}>
        {/* List panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {sectors.map(s => (
              <button key={s} onClick={() => setFilter(s)} style={{
                background: filter === s ? D.sage : 'transparent',
                border: `1px solid ${filter === s ? D.sage : D.hairline}`,
                color: filter === s ? D.plumDeep : D.ink70,
                padding: '5px 11px', borderRadius: 7,
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: FONT_BODY,
              }}>{s}</button>
            ))}
          </div>

          <Card padding={0} style={{ flex: 1, overflow: 'auto' }}>
            <div style={{
              padding: '10px 14px',
              fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600,
              borderBottom: `1px solid ${D.hairline}`,
              display: 'grid', gridTemplateColumns: '1fr 70px 60px',
            }}>
              <div>Symbol</div><div style={{ textAlign: 'right' }}>Price</div><div style={{ textAlign: 'right' }}>%</div>
            </div>
            {filtered.map(s => (
              <div key={s.ticker} onClick={() => setSelected(s.ticker)} style={{
                display: 'grid', gridTemplateColumns: '1fr 70px 60px',
                padding: '12px 14px', alignItems: 'center', cursor: 'pointer',
                background: selected === s.ticker ? D.surface3 : 'transparent',
                borderLeft: selected === s.ticker ? `2px solid ${D.sage}` : '2px solid transparent',
                borderBottom: `1px solid ${D.hairline}`,
              }}
              onMouseEnter={(e) => { if (selected !== s.ticker) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={(e) => { if (selected !== s.ticker) e.currentTarget.style.background = 'transparent'; }}
              >
                <div>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13.5, color: D.ink, letterSpacing: 0.2 }}>{s.ticker}</div>
                  <div style={{ fontSize: 11, color: D.ink50, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                </div>
                <div style={{ textAlign: 'right', fontFamily: FONT_BODY, fontVariantNumeric: 'tabular-nums', color: D.ink, fontSize: 13, fontWeight: 500 }}>€{s.price.toFixed(2)}</div>
                <div style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontSize: 12, fontWeight: 600,
                  color: s.changePct >= 0 ? D.buy : D.sell }}>
                  {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Detail panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0, overflow: 'auto' }}>
          <Card padding={22}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: D.surface3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, color: D.ink, letterSpacing: 0.2,
                }}>{stock.ticker.slice(0, 4)}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 22, color: D.ink, letterSpacing: '-0.01em' }}>{stock.ticker}</div>
                    <Pill color={D.ink70} bg="rgba(255,255,255,0.06)">{stock.sector}</Pill>
                    <Pill color={D.spring} bg="rgba(168,214,112,0.14)">● Live</Pill>
                  </div>
                  <div style={{ fontSize: 13, color: D.ink50 }}>{stock.name}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Money value={stock.price} currency="EUR" big/>
                <div style={{ marginTop: 4 }}><Delta value={stock.change} pct={stock.changePct}/></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginTop: 18, marginBottom: 8 }}>
              {['1D', '1W', '1M', '3M', 'YTD', '1Y', 'ALL'].map(r => (
                <button key={r} onClick={() => setRange(r)} style={{
                  background: range === r ? D.sage : 'transparent',
                  border: `1px solid ${range === r ? D.sage : D.hairline}`,
                  color: range === r ? D.plumDeep : D.ink70,
                  padding: '5px 12px', borderRadius: 7,
                  fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                  fontFamily: FONT_BODY,
                }}>{r}</button>
              ))}
            </div>

            <div style={{ marginTop: 6, marginLeft: -8, marginRight: -8, position: 'relative' }}>
              <AreaChart data={[...adjusted, ...prediction.slice(1)]} height={240} color={stock.changePct >= 0 ? D.sage : D.sell}/>
              <div style={{
                position: 'absolute', top: 8, right: 12, padding: '6px 10px',
                background: 'rgba(0,0,0,0.4)', borderRadius: 7, border: `1px solid ${D.hairline}`,
                fontSize: 11, color: D.ink70, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 18, height: 2, borderTop: `2px dashed ${D.spring}` }}/>
                ML forecast · 7d
              </div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr', gap: 16 }}>
            <Card padding={22}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 18 }}>
                <KPI label="Open" value={`€${(stock.price - stock.change).toFixed(2)}`}/>
                <KPI label="Day high" value={`€${(stock.price * 1.012).toFixed(2)}`}/>
                <KPI label="Day low" value={`€${(stock.price * 0.987).toFixed(2)}`}/>
                <KPI label="Volume" value={`${(stock.volume / 1000).toFixed(1)}k`}/>
                <KPI label="Mkt cap" value={`€${stock.mcap}`}/>
                <KPI label="Volatility" value={`${(stock.volatility * 100).toFixed(1)}%`}/>
                <KPI label="P/E" value="24.6"/>
                <KPI label="52w range" value={`€${(stock.price * 0.6).toFixed(0)}–${(stock.price * 1.4).toFixed(0)}`}/>
              </div>

              <div style={{
                background: `linear-gradient(135deg, ${D.surface2}, ${D.surface3})`,
                borderRadius: 14, padding: 16,
                display: 'flex', gap: 16, alignItems: 'center',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(168,214,112,0.16)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M3 16l5-5 3 3 6-8" stroke={D.spring} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="17" cy="6" r="2" stroke={D.spring} strokeWidth="1.5"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 4 }}>Algorithmic forecast · 7-day</div>
                  <div style={{ fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 16, color: D.ink, letterSpacing: '-0.01em' }}>
                    Target <span style={{ color: D.spring }}>€{(stock.price * (1 + stock.changePct / 100 * 1.5)).toFixed(2)}</span>
                    <span style={{ color: D.ink50, fontSize: 13, fontWeight: 400, marginLeft: 8 }}>· 71% confidence</span>
                  </div>
                </div>
                <a href={`/trade?ticker=${stock.ticker}`} style={{
                  background: D.spring, border: 'none', color: D.plumDeep,
                  padding: '8px 14px', borderRadius: 9, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  fontFamily: FONT_BODY, textDecoration: 'none',
                }}>Trade now</a>
              </div>
            </Card>

            <Card padding={0}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${D.hairline}` }}>
                <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14, color: D.ink, letterSpacing: '-0.01em' }}>Order book</div>
                <div style={{ fontSize: 11, color: D.ink50, marginTop: 2 }}>Top 7 bids & asks · live</div>
              </div>
              <div style={{ padding: '8px 18px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', fontSize: 10.5, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>
                <div>Bid</div><div style={{ textAlign: 'center' }}>Qty</div><div style={{ textAlign: 'right' }}>Ask</div>
              </div>

              {orderBook.bids.map((b, i) => {
                const a = orderBook.asks[i];
                return (
                  <div key={i} style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                    fontSize: 12, fontVariantNumeric: 'tabular-nums',
                    padding: '5px 18px', position: 'relative', alignItems: 'center',
                  }}>
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      width: `${(b.qty / maxQty) * 50}%`, maxWidth: '50%',
                      background: D.buyBg, opacity: 0.6,
                    }}/>
                    <div style={{
                      position: 'absolute', right: 0, top: 0, bottom: 0,
                      width: `${(a.qty / maxQty) * 50}%`, maxWidth: '50%',
                      background: D.sellBg, opacity: 0.6,
                    }}/>
                    <div style={{ color: D.buy, fontWeight: 600, position: 'relative' }}>€{b.price.toFixed(2)}</div>
                    <div style={{ textAlign: 'center', color: D.ink70, position: 'relative' }}>{(b.qty + a.qty).toLocaleString()}</div>
                    <div style={{ textAlign: 'right', color: D.sell, fontWeight: 600, position: 'relative' }}>€{a.price.toFixed(2)}</div>
                  </div>
                );
              })}

              <div style={{ borderTop: `1px solid ${D.hairline}`, padding: '12px 18px', marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: D.surface2 }}>
                <div style={{ fontSize: 11, color: D.ink50 }}>Spread</div>
                <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12.5, color: D.ink, fontVariantNumeric: 'tabular-nums' }}>
                  €{(orderBook.asks[0].price - orderBook.bids[0].price).toFixed(2)} <span style={{ color: D.ink50, fontWeight: 400 }}>· 0.14%</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
