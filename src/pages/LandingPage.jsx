// LandingPage — public marketing page, no AppShell.
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { D, FONT_HEAD, FONT_BODY } from '../theme/tokens';
import { WakibiMark } from '../components/shared/WakibiMark';
import { Pill, AreaChart, genSeries } from '../components/shared/dark-ui';
import { getStocks } from '../api/market';

export default function LandingPage() {
  const [, setTick] = useState(0);
  const [stocks, setStocks] = useState([]);

  useEffect(() => {
    getStocks().then(list => { if (list.length > 0) setStocks(list); }).catch(() => {});
    const id = setInterval(() => setTick(t => t + 1), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      width: '100%', minHeight: '100vh', overflow: 'auto',
      background: D.bg, color: D.ink, fontFamily: FONT_BODY,
    }}>
      {/* Top nav */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', borderBottom: `1px solid ${D.hairline}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: D.sage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WakibiMark size={22} color={D.plum} accent={D.plum}/>
          </div>
          <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>
            Wakibi <span style={{ color: D.ink50, fontWeight: 400 }}>·</span> Trade
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" style={{
            background: 'transparent', border: `1px solid ${D.hairline2}`, color: D.ink,
            padding: '8px 18px', borderRadius: 9, fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
          }}>Log in</Link>
          <Link to="/signup" style={{
            background: D.sage, border: 'none', color: D.plumDeep,
            padding: '8px 18px', borderRadius: 9, fontFamily: FONT_BODY, fontWeight: 700, fontSize: 13,
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
          }}>Open account</Link>
        </div>
      </header>

      {/* Ticker tape */}
      <div style={{
        background: D.surface, borderBottom: `1px solid ${D.hairline}`,
        padding: '10px 0', overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          display: 'flex', gap: 36, whiteSpace: 'nowrap',
          animation: 'lp-tape 60s linear infinite',
          width: 'max-content',
        }}>
          {[...stocks, ...stocks].map((s, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12.5, fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ fontFamily: FONT_HEAD, fontWeight: 700, color: D.ink, letterSpacing: 0.3 }}>{s.ticker}</span>
              <span style={{ color: D.ink70 }}>${s.price.toFixed(2)}</span>
              <span style={{ color: s.changePct >= 0 ? D.buy : D.sell, fontWeight: 600 }}>
                {s.changePct >= 0 ? '+' : ''}{s.changePct.toFixed(2)}%
              </span>
            </span>
          ))}
        </div>
        <style>{`@keyframes lp-tape { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
      </div>

      {/* Hero */}
      <section style={{
        padding: '80px 48px 60px',
        display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -200, top: -100, width: 600, height: 600,
          borderRadius: '50%', background: `radial-gradient(circle, ${D.sage}22 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}/>

        <div style={{ position: 'relative' }}>

          <h1 style={{
            fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 72, lineHeight: 0.98,
            letterSpacing: '-0.03em', color: D.ink, margin: 0,
          }}>
            Markets that<br/>
            <span style={{ color: D.sage }}>move money</span><br/>
            in two directions.
          </h1>
          <p style={{ fontSize: 17, color: D.ink70, lineHeight: 1.55, marginTop: 24, maxWidth: 520 }}>
            Trade stocks and options with bracket orders, live order books, and ML forecasts. Every fee you pay funds a microloan for an entrepreneur somewhere in the world.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            <Link to="/signup" style={{
              background: D.sage, border: 'none', color: D.plumDeep,
              padding: '14px 26px', borderRadius: 11, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15,
              cursor: 'pointer', letterSpacing: '-0.005em', boxShadow: `0 8px 24px ${D.sage}33`,
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
            }}>Open free account →</Link>
          </div>

        </div>

        {/* Right — floating dashboard preview */}
        <div style={{ position: 'relative', height: 460 }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: D.surface, border: `1px solid ${D.hairline}`,
            borderRadius: 18, padding: 22, transform: 'rotate(-2deg)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>ZEDA · Zeda Cloud</div>
                <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 26, color: D.ink, marginTop: 4 }}>$188.72</div>
              </div>
              <Pill color={D.buy} bg={D.buyBg}>+3.77%</Pill>
            </div>
            <AreaChart data={genSeries(99, 60, 175, 0.04)} height={180} color={D.sage}/>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${D.hairline}` }}>
              {[['Volume', '122k'], ['σ', '5.2%'], ['Forecast', '$198']].map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{k}</div>
                  <div style={{ fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 14, color: D.ink, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: -20, left: -28,
            background: `linear-gradient(140deg, ${D.plum}, ${D.plumDeep})`,
            borderRadius: 14, padding: 16, width: 220,
            transform: 'rotate(3deg)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            border: `1px solid ${D.hairline2}`,
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 6 }}>
              Trade #324,891
            </div>
            <div style={{ fontSize: 13, color: '#fff', lineHeight: 1.4 }}>
              Your fee just funded <strong style={{ color: D.spring }}>$0.42</strong> of a coffee co-op loan in <strong style={{ color: D.spring }}>Honduras</strong>.
            </div>
          </div>
        </div>
      </section>


      {/* Features */}
      <section style={{ padding: '40px 48px 80px' }}>
        <div style={{ maxWidth: 720, marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: D.sage, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 12 }}>What you get</div>
          <h2 style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 42, color: D.ink, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
            Pro tools, dressed for daylight.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {[
            { icon: '◑', title: 'Market & limit orders', body: 'Bracket, OCO and time-in-force controls. Funds freeze on order placement and release on fill or cancel.' },
            { icon: '◐', title: 'Live order book', body: 'Real depth visualisation per ticker. See where the volume is sitting before you commit.' },
            { icon: '◇', title: 'ML price forecasts', body: 'Walk-forward predictions with confidence bands, recalibrated each tick of the simulation engine.' },
            { icon: '◈', title: 'Options chain', body: 'Calls and puts on every listed equity. Greeks computed against the BCN volatility model.' },
            { icon: '◉', title: 'Multi-currency wallets', body: 'EUR and RON accounts side-by-side. Move funds instantly with no FX spread on internal transfers.' },
            { icon: '✦', title: 'Trade with purpose', body: '100% of platform proceeds fund microloans through Wakibi. Track your impact in real time.' },
          ].map(f => (
            <div key={f.title} style={{
              background: D.surface, border: `1px solid ${D.hairline}`,
              borderRadius: 14, padding: 24,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: D.sageBg, color: D.sage,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, marginBottom: 14,
              }}>{f.icon}</div>
              <div style={{ fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 16, color: D.ink, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: D.ink70, lineHeight: 1.55 }}>{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '48px', borderTop: `1px solid ${D.hairline}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40,
        fontSize: 12.5, color: D.ink50,
      }}>
        <div style={{ maxWidth: 320 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: D.sage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WakibiMark size={20} color={D.plum} accent={D.plum}/>
            </div>
            <span style={{ fontFamily: FONT_HEAD, fontWeight: 700, color: D.ink, fontSize: 15 }}>Wakibi · Trade</span>
          </div>
          <div>A small push makes a world of difference. Trade markets, fund microloans, change a life.</div>
        </div>
      </footer>
    </div>
  );
}
