import React from 'react';
import { W, FONT_HEAD } from '../../theme/tokens';

export const WakibiMark = ({ size = 28, color = W.plum, accent = W.sage }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
    <path d="M14 38 C 22 22, 42 22, 50 38" stroke={color} strokeWidth="3.5" strokeLinecap="round" fill="none"/>
    <circle cx="14" cy="20" r="5.5" fill={color}/>
    <rect x="11" y="28" width="6" height="20" rx="3" fill={color}/>
    <circle cx="50" cy="20" r="5.5" fill={accent}/>
    <rect x="47" y="28" width="6" height="20" rx="3" fill={accent}/>
  </svg>
);

export const Logo = ({ tone = 'dark' }) => {
  const c = tone === 'dark' ? W.plum : '#fff';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <WakibiMark size={32} color={c} accent={tone === 'dark' ? W.sage : W.spring}/>
      <div style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 22, color: c, letterSpacing: '-0.01em', lineHeight: 1 }}>
        Wakibi <span style={{ fontWeight: 400, opacity: 0.6 }}>·</span> <span style={{ fontWeight: 600 }}>Trade</span>
      </div>
    </div>
  );
};
