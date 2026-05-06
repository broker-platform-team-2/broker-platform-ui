// Shared dark-theme primitives (Card, Pill, Money, Delta, Sparkline, AreaChart, KPI).
import React, {useState} from 'react';
import { D, FONT_HEAD, FONT_BODY } from '../../theme/tokens';

export const Card = ({ children, padding = 22, style }) => (
  <div style={{
    background: D.surface,
    border: `1px solid ${D.hairline}`,
    borderRadius: 18,
    padding,
    ...style,
  }}>{children}</div>
);

export const Pill = ({ children, color = D.sage, bg = D.sageBg, size = 'sm' }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: size === 'sm' ? '2px 8px' : '4px 10px',
    background: bg, color, borderRadius: 999,
    fontFamily: FONT_BODY, fontWeight: 600,
    fontSize: size === 'sm' ? 11 : 12, letterSpacing: 0.2,
  }}>{children}</span>
);

export const Money = ({ value, currency = 'EUR', dim = false, big = false, sign = false }) => {
  const sym = currency === 'EUR' ? '€' : currency === 'RON' ? 'lei ' : '$';
  const v = Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <span style={{
      fontFamily: FONT_HEAD, fontWeight: big ? 700 : 600,
      fontSize: big ? 32 : 'inherit',
      color: dim ? D.ink50 : D.ink,
      letterSpacing: big ? '-0.02em' : 'inherit',
      fontVariantNumeric: 'tabular-nums',
    }}>
      {sign && value > 0 ? '+' : value < 0 ? '−' : ''}{sym}{v}
    </span>
  );
};

export const Delta = ({ value, pct }) => {
  const up = value >= 0;
  return (
    <span style={{
      fontFamily: FONT_BODY, fontVariantNumeric: 'tabular-nums', fontWeight: 600,
      color: up ? D.buy : D.sell, fontSize: 13,
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      <span style={{ display: 'inline-block', width: 0, height: 0,
        borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
        borderBottom: up ? `5px solid ${D.buy}` : 'none',
        borderTop: !up ? `5px solid ${D.sell}` : 'none',
      }}/>
      {up ? '+' : '−'}{Math.abs(value).toFixed(2)} ({up ? '+' : '−'}{Math.abs(pct).toFixed(2)}%)
    </span>
  );
};

export const Sparkline = ({ data, width = 90, height = 28, color }) => {
  if (!data || !data.length) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const path = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(2)},${(height - ((v - min) / range) * height).toFixed(2)}`).join(' ');
  const c = color || (data[data.length - 1] >= data[0] ? D.buy : D.sell);
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={path} fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

export const AreaChart = ({ data, height = 220, color = D.sage, glow = true }) => {
  if (!data || !data.length) return null;
  const w = 800;
  const h = height;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => [i * step, h - ((v - min) / range) * (h - 24) - 12]);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
  const area = `${path} L ${w},${h} L 0,${h} Z`;
  const id = 'g' + Math.floor(Math.random() * 100000);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height, display: 'block' }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1="0" x2={w} y1={h * t} y2={h * t} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 4"/>
      ))}
      <path d={area} fill={`url(#${id})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
        style={glow ? { filter: `drop-shadow(0 0 6px ${color}88)` } : {}}/>
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="4" fill={color}/>
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="9" fill={color} opacity="0.18"/>
    </svg>
  );
};

export const KPI = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>{label}</div>
    <div style={{ fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 16, color: D.ink, marginTop: 4, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>{value}</div>
  </div>
);

// Stable PRNG used for chart/order-book mocks.
export function seedRand(seed) {
  let s = seed;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export function genSeries(seed, points = 60, base = 100, vol = 0.03) {
  const r = seedRand(seed);
  const arr = [];
  let p = base;
  for (let i = 0; i < points; i++) {
    p = p + p * vol * (r() - 0.5);
    arr.push(Math.max(0.5, p));
  }
  return arr;
}

export function genOrderBook(price, seed) {
  const r = seedRand(seed);
  const bids = [], asks = [];
  for (let i = 0; i < 7; i++) {
    bids.push({ price: +(price - (i + 1) * 0.10 - r() * 0.05).toFixed(2), qty: Math.floor(r() * 800 + 100) });
    asks.push({ price: +(price + (i + 1) * 0.10 + r() * 0.05).toFixed(2), qty: Math.floor(r() * 800 + 100) });
  }
  return { bids, asks };
}

