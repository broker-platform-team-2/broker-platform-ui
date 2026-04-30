import React from 'react';
import { W, FONT_HEAD, FONT_BODY } from '../../theme/tokens';
import { Logo } from '../shared/WakibiMark';

const Stat = ({ value, label }) => (
  <div style={{ textAlign: 'center', padding: '0 8px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
    <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 26, color: '#fff', lineHeight: 1, letterSpacing: '-0.01em' }}>{value}</div>
    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 }}>{label}</div>
  </div>
);

export const BrandPanel = ({ accentColor }) => {
  const accent = accentColor || W.sage;
  return (
    <div style={{
      flex: 1,
      background: W.plum,
      color: '#fff',
      padding: '40px 44px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      minWidth: 380,
    }}>
      <svg viewBox="0 0 600 800" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.95 }} preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="bp-g1" cx="20%" cy="20%" r="80%">
            <stop offset="0%" stopColor={W.plumDk} stopOpacity="0.0"/>
            <stop offset="100%" stopColor="#000" stopOpacity="0.25"/>
          </radialGradient>
        </defs>
        <rect width="600" height="800" fill="url(#bp-g1)"/>
        <circle cx="520" cy="120" r="180" fill={accent} opacity="0.18"/>
        <circle cx="80" cy="680" r="220" fill={W.orchid} opacity="0.16"/>
        <circle cx="480" cy="640" r="90" fill={W.citrus} opacity="0.22"/>
      </svg>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Logo tone="light"/>

        <div style={{ marginTop: 'auto' }}>
          <div style={{
            fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 44, lineHeight: 1.05,
            letterSpacing: '-0.02em', color: '#fff',
            marginBottom: 18,
          }}>
            Set something<br/>good in motion.
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 16, lineHeight: 1.55, color: 'rgba(255,255,255,0.78)', maxWidth: 360, marginBottom: 32 }}>
            Trade stocks and options on the Wakibi exchange. 100% of platform proceeds support microloans for entrepreneurs in 70+ countries.
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 18,
            padding: '18px 4px',
            marginBottom: 28,
          }}>
            <Stat value="98%" label="Repaid"/>
            <Stat value="300+" label="Local partners"/>
            <Stat value="70+" label="Countries"/>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'rgba(255,255,255,0.7)' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 28,
              background: accent, color: W.plum,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 22,
              flexShrink: 0,
            }}>
              ii
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, lineHeight: 1.5 }}>
              Repaid with money<br/>
              <span style={{ color: '#fff', fontWeight: 600 }}>and a smile.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
