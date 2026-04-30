// Shared light-theme UI primitives for the auth screens.
import React, { useState } from 'react';
import { W, FONT_HEAD, FONT_BODY } from '../../theme/tokens';

export const Field = ({ label, error, hint, children, right }) => (
  <label style={{ display: 'block', marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
      <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, color: W.ink, letterSpacing: 0.1 }}>{label}</span>
      {right}
    </div>
    {children}
    {error && (
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: W.danger, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill="none" stroke={W.danger}/><path d="M6 3v3.5M6 8.5v.6" stroke={W.danger} strokeWidth="1.2" strokeLinecap="round"/></svg>
        {error}
      </div>
    )}
    {hint && !error && (
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: W.ink40, marginTop: 6 }}>{hint}</div>
    )}
  </label>
);

export const Input = ({ value, onChange, type = 'text', placeholder, autoComplete, invalid, leftIcon, rightSlot, autoFocus, onBlur, name }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: W.surface,
      border: `1.5px solid ${invalid ? W.danger : focused ? W.plum : W.hairline}`,
      borderRadius: 14,
      padding: '0 14px',
      height: 48,
      transition: 'border-color .15s, box-shadow .15s',
      boxShadow: focused ? `0 0 0 4px ${invalid ? 'rgba(192,57,43,0.12)' : 'rgba(94,15,64,0.08)'}` : 'none',
    }}>
      {leftIcon && <div style={{ display: 'flex', marginRight: 10, color: W.ink40 }}>{leftIcon}</div>}
      <input
        name={name} type={type} value={value} autoFocus={autoFocus} autoComplete={autoComplete} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={(e) => { setFocused(false); onBlur && onBlur(e); }}
        style={{
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontFamily: FONT_BODY, fontSize: 15, color: W.ink, height: '100%', letterSpacing: 0.1,
        }}
      />
      {rightSlot}
    </div>
  );
};

export const Button = ({ children, onClick, variant = 'primary', loading, disabled, full, type = 'button' }) => {
  const styles = {
    primary: { bg: W.plum, fg: '#fff', hover: W.plumDk, border: 'none' },
    sage:    { bg: W.sage, fg: W.plum, hover: W.sageDk, border: 'none' },
    ghost:   { bg: 'transparent', fg: W.plum, hover: 'rgba(94,15,64,0.06)', border: `1.5px solid ${W.hairline}` },
    link:    { bg: 'transparent', fg: W.plum, hover: 'transparent', border: 'none' },
  }[variant];
  const [hover, setHover] = useState(false);
  return (
    <button
      type={type} onClick={onClick} disabled={disabled || loading}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: full ? '100%' : 'auto',
        height: variant === 'link' ? 'auto' : 48,
        padding: variant === 'link' ? '0' : '0 22px',
        background: hover && !disabled ? styles.hover : styles.bg,
        color: styles.fg, border: styles.border, borderRadius: 14,
        fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 15,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'background .15s, transform .08s',
        textDecoration: variant === 'link' ? 'underline' : 'none', textUnderlineOffset: 3,
      }}
    >
      {loading ? <Spinner color={styles.fg}/> : children}
    </button>
  );
};

export const Spinner = ({ color = '#fff', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'wb-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeOpacity="0.25" strokeWidth="3"/>
    <path d="M12 3 a9 9 0 0 1 9 9" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

export const Divider = ({ children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0', color: W.ink40 }}>
    <div style={{ flex: 1, height: 1, background: W.hairline }}/>
    <span style={{ fontFamily: FONT_BODY, fontSize: 12, letterSpacing: 0.4, textTransform: 'uppercase' }}>{children}</span>
    <div style={{ flex: 1, height: 1, background: W.hairline }}/>
  </div>
);

export const Checkbox = ({ checked, onChange, children }) => (
  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 13, color: W.ink60, lineHeight: 1.5 }}>
    <span
      onClick={() => onChange(!checked)}
      style={{
        width: 18, height: 18, borderRadius: 6, marginTop: 1,
        border: `1.5px solid ${checked ? W.plum : W.hairline}`,
        background: checked ? W.plum : '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'all .15s',
      }}
    >
      {checked && <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2.5 6.5L5 9l4.5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
    </span>
    <span>{children}</span>
  </label>
);

export const Icon = {
  mail: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="3" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M2 4l6 5 6-5" stroke="currentColor" strokeWidth="1.4" fill="none"/></svg>,
  lock: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2.5" y="7" width="11" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.4" fill="none"/></svg>,
  user: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.4"/><path d="M2.5 14c.7-3 2.9-4.5 5.5-4.5S13 11 13.5 14" stroke="currentColor" strokeWidth="1.4" fill="none"/></svg>,
  eye: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>,
  eyeOff: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.4"/><path d="M6 6.3a2 2 0 0 0 2.8 2.8M3.5 4.5C2.2 5.7 1.5 8 1.5 8s2.5 4.5 6.5 4.5c1.4 0 2.6-.4 3.6-1M7 3.6c.3 0 .7-.1 1-.1 4 0 6.5 4.5 6.5 4.5s-.6 1-1.6 2.1" stroke="currentColor" strokeWidth="1.4" fill="none"/></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  back: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 7H3M7 3L3 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7l3 3 5-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>,
  shield: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l5 2v4c0 3-2.5 5.5-5 6-2.5-.5-5-3-5-6V3l5-2z" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M5 7l1.5 1.5L9 6" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/></svg>,
  globe: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1.5 7h11M7 1.5c2 1.7 2 9.3 0 11M7 1.5c-2 1.7-2 9.3 0 11" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>,
};

// Validation helpers
export function passwordChecks(pw) {
  return {
    length: pw.length >= 10,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    digit: /\d/.test(pw),
    symbol: /[^A-Za-z0-9]/.test(pw),
  };
}
export function passwordScore(pw) {
  return Object.values(passwordChecks(pw)).filter(Boolean).length;
}
export function passwordValid(pw) { return passwordScore(pw) >= 4 && pw.length >= 10; }
export const emailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export const ReqDot = ({ ok, children }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: ok ? W.sageDk : W.ink40, transition: 'color .15s' }}>
    <span style={{
      width: 12, height: 12, borderRadius: 6,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: ok ? W.sage : 'transparent',
      border: ok ? 'none' : `1.2px solid ${W.hairline}`,
      color: '#fff',
    }}>{ok && Icon.check}</span>
    {children}
  </span>
);

export const StrengthMeter = ({ password }) => {
  const score = passwordScore(password);
  const colors = [W.hairline, W.danger, '#E89E55', W.citrus, W.spring, W.sage];
  const checks = passwordChecks(password);
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i < score ? colors[score] : W.hairline,
            transition: 'background .2s'
          }}/>
        ))}
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11.5, color: W.ink40, display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
        <ReqDot ok={checks.length}>10+ characters</ReqDot>
        <ReqDot ok={checks.upper}>Uppercase</ReqDot>
        <ReqDot ok={checks.lower}>Lowercase</ReqDot>
        <ReqDot ok={checks.digit}>Number</ReqDot>
        <ReqDot ok={checks.symbol}>Symbol</ReqDot>
      </div>
    </div>
  );
};

export const Heading = ({ eyebrow, title, sub }) => (
  <div style={{ marginBottom: 24 }}>
    {eyebrow && (
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: W.sageDk, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: W.sage }}/>
        {eyebrow}
      </div>
    )}
    <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 28, color: W.ink, letterSpacing: '-0.015em', lineHeight: 1.15, marginBottom: 8 }}>
      {title}
    </div>
    {sub && (
      <div style={{ fontFamily: FONT_BODY, fontSize: 14.5, color: W.ink60, lineHeight: 1.5 }}>{sub}</div>
    )}
  </div>
);

export const ErrorBanner = ({ children }) => (
  <div style={{
    display: 'flex', alignItems: 'flex-start', gap: 10,
    background: 'rgba(192,57,43,0.08)',
    border: `1px solid rgba(192,57,43,0.25)`,
    borderRadius: 12, padding: '12px 14px', marginBottom: 16,
    fontFamily: FONT_BODY, fontSize: 13.5, color: W.danger, lineHeight: 1.4,
  }}>
    <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="8" cy="8" r="7.25" fill="none" stroke={W.danger} strokeWidth="1.4"/><path d="M8 4v5M8 11v.6" stroke={W.danger} strokeWidth="1.4" strokeLinecap="round"/></svg>
    {children}
  </div>
);
