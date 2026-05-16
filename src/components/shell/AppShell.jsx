import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { D, FONT_HEAD, FONT_BODY } from '../../theme/tokens';
import { WakibiMark } from '../shared/WakibiMark';
import { useAuth } from '../../context/AuthContext';
import { useAccount } from '../../context/AccountContext';
import { useNotificationsContext, useNotificationMessage } from '../../context/NotificationsContext';

const NAV = [
  { id: 'home',   label: 'Home',    icon: 'home',   path: '/home' },
  { id: 'stocks', label: 'Markets', icon: 'chart',  path: '/markets' },
  { id: 'trade',  label: 'Trade',   icon: 'arrows', path: '/trade' },
  { id: 'orders', label: 'Orders',  icon: 'list',   path: '/orders' },
  { id: 'wallet',   label: 'Wallet',  icon: 'wallet',   path: '/wallet' },
  { id: 'options',  label: 'Options', icon: 'options',  path: '/options' },
];


const NavIcon = ({ name }) => {
  const p = { width: 18, height: 18, viewBox: '0 0 18 18', fill: 'none' };
  if (name === 'home')   return <svg {...p}><path d="M3 8l6-5 6 5v7H3z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7 15v-4h4v4" stroke="currentColor" strokeWidth="1.5"/></svg>;
  if (name === 'chart')  return <svg {...p}><path d="M3 14l4-4 3 3 5-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 16h12" stroke="currentColor" strokeWidth="1.5"/></svg>;
  if (name === 'arrows') return <svg {...p}><path d="M4 6h10l-3-3M14 12H4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (name === 'list')   return <svg {...p}><path d="M5 5h10M5 9h10M5 13h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
  if (name === 'wallet')  return <svg {...p}><rect x="2.5" y="5" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2.5 8h13" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="11" r="0.8" fill="currentColor"/></svg>;
  if (name === 'options') return <svg {...p}><rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="10" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="10" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.5"/><path d="M10.5 12.5h4M12.5 10.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
  if (name === 'search')  return <svg {...p}><circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5"/><path d="M12 12l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>;
  if (name === 'bell')   return <svg {...p}><path d="M5 8a4 4 0 1 1 8 0c0 3 1 4 1 4H4s1-1 1-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M7.5 14a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.5"/></svg>;
  return null;
};

const Sidebar = ({ marketStatus }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const active = NAV.find(n => location.pathname.startsWith(n.path))?.id ?? 'home';

  return (
    <aside style={{
      width: 220, flexShrink: 0,
      background: D.bg,
      borderRight: `1px solid ${D.hairline}`,
      padding: '20px 14px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ padding: '6px 10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: D.sage, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WakibiMark size={22} color={D.plum} accent={D.plum}/>
        </div>
        <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, color: D.ink, letterSpacing: '-0.01em' }}>
          Wakibi <span style={{ fontWeight: 400, color: D.ink50 }}>·</span> <span style={{ fontWeight: 600 }}>Trade</span>
        </div>
      </div>

      {NAV.map(item => (
        <button key={item.id} onClick={() => navigate(item.path)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px',
            background: active === item.id ? D.surface2 : 'transparent',
            border: 'none', borderRadius: 10,
            color: active === item.id ? D.ink : D.ink70,
            cursor: 'pointer',
            fontFamily: FONT_BODY, fontSize: 14, fontWeight: active === item.id ? 600 : 500,
            textAlign: 'left',
            transition: 'background .15s, color .15s',
          }}
          onMouseEnter={(e) => { if (active !== item.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          onMouseLeave={(e) => { if (active !== item.id) e.currentTarget.style.background = 'transparent'; }}
        >
          <NavIcon name={item.icon}/>
          {item.label}
        </button>
      ))}

      <div style={{ flex: 1 }}/>
      <div style={{
        background: D.surface, borderRadius: 14, padding: '14px',
        border: `1px solid ${D.hairline}`,
      }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Market</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          {marketStatus == null ? (
            <span style={{ width: 8, height: 8, borderRadius: 4, background: D.ink30 }}/>
          ) : (
            <span style={{
              width: 8, height: 8, borderRadius: 4,
              background: marketStatus.isOpen ? D.sage : D.sell,
              boxShadow: marketStatus.isOpen ? `0 0 8px ${D.sage}` : `0 0 8px ${D.sell}`,
            }}/>
          )}
          <span style={{ fontFamily: FONT_HEAD, fontSize: 14, fontWeight: 600, color: D.ink }}>
            {marketStatus == null ? '…' : marketStatus.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      <button onClick={logout} style={{
        marginTop: 12,
        background: 'transparent', border: `1px solid ${D.hairline}`, color: D.ink70,
        padding: '8px 12px', borderRadius: 10, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500,
        cursor: 'pointer',
      }}>Sign out</button>
    </aside>
  );
};

function noteColor(type) {
  if (type === 'ORDER_UPDATE') return D.buy;
  if (type === 'MARKET_EVENT') return D.warn;
  if (type === 'PRICE_UPDATE') return D.teal;
  return D.ink50;
}

function noteText(n) {
  const p = n.payload ?? n.data ?? n;
  if (n.type === 'ORDER_UPDATE') {
    const id = p.order_id ?? p.orderId ?? '';
    const status = p.status ?? '';
    return `Order ${id ? '#' + id : ''} → ${status}`;
  }
  if (n.type === 'MARKET_EVENT') {
    // The exchange sends MARKET_EVENT with empty fields as a signal only;
    // actual status is fetched via REST. Show whatever non-empty data exists.
    const headline = p.headline ?? p.message ?? p.description ?? p.event ?? p.text ?? '';
    const kind = p.event_type ?? p.eventType ?? p.status ?? p.kind ?? '';
    if (headline && kind) return `${kind}: ${headline}`;
    if (headline) return headline;
    if (kind) return kind;
    const vals = Object.entries(p)
      .filter(([, v]) => typeof v === 'string' && v.trim())
      .map(([, v]) => v)
      .join(' · ');
    return vals || 'Market status changed — check sidebar';
  }
  if (n.type === 'PRICE_UPDATE') {
    const ticker = p.ticker ?? p.symbol ?? '';
    const price = p.current_price ?? p.price ?? '';
    return `${ticker}${price ? ' @ $' + Number(price).toFixed(2) : ''}`;
  }
  return JSON.stringify(p).slice(0, 80);
}

// Inject slide-in animation once
if (typeof document !== 'undefined' && !document.getElementById('toast-keyframes')) {
  const s = document.createElement('style');
  s.id = 'toast-keyframes';
  s.textContent = '@keyframes fadeSlideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }';
  document.head.appendChild(s);
}

// ── Toast notifications ────────────────────────────────────────────────────────
const TOAST_DURATION = 6000; // ms before auto-dismiss

function ToastStack() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  // Keep a live ref to marketStatus so the delayed MARKET_EVENT toast can read
  // the freshly-fetched value (the context updates it ~500 ms after the event)
  const { marketStatus } = useNotificationsContext() ?? {};
  const marketStatusRef = useRef(marketStatus);
  useEffect(() => { marketStatusRef.current = marketStatus; }, [marketStatus]);

  const dismiss = (id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useNotificationMessage((msg) => {
    if (!['ORDER_UPDATE', 'MARKET_EVENT'].includes(msg?.type)) return;
    const id = Date.now() + Math.random();

    if (msg.type === 'MARKET_EVENT') {
      // Wait 800 ms so getMarketStatus() in NotificationsContext has time to resolve
      setTimeout(() => {
        const ms = marketStatusRef.current;
        const text = ms
          ? `Market is now ${ms.isOpen ? 'OPEN 🟢' : 'CLOSED 🔴'}`
          : 'Market status changed';
        const toast = { id, type: 'MARKET_EVENT', text, color: noteColor('MARKET_EVENT') };
        setToasts(prev => [...prev.slice(-4), toast]);
        timers.current[id] = setTimeout(() => dismiss(id), TOAST_DURATION);
      }, 800);
    } else {
      const toast = { id, type: msg.type, text: noteText(msg), color: noteColor(msg.type) };
      setToasts(prev => [...prev.slice(-4), toast]);
      timers.current[id] = setTimeout(() => dismiss(id), TOAST_DURATION);
    }
  });

  // Clean up timers on unmount
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          minWidth: 260, maxWidth: 360,
          background: D.surface2,
          border: `1px solid ${t.color}44`,
          borderLeft: `4px solid ${t.color}`,
          borderRadius: 12,
          padding: '12px 14px',
          boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'flex-start', gap: 10,
          animation: 'fadeSlideIn 0.2s ease',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 11, color: t.color, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>
              {t.type.replace(/_/g, ' ')}
            </div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: D.ink, lineHeight: 1.4 }}>
              {t.text}
            </div>
          </div>
          <button onClick={() => dismiss(t.id)} style={{
            background: 'transparent', border: 'none', color: D.ink50,
            cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px', flexShrink: 0,
          }}>×</button>
        </div>
      ))}
    </div>
  );
}

const SYMBOLS = { EUR: '€', RON: 'lei ', USD: '$', GBP: '£', CHF: 'CHF ' };

function formatAmount(amount, currency) {
  const sym = SYMBOLS[currency] || `${currency} `;
  const v = Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
  return `${sym}${v}`;
}

const TopBar = ({ title, subtitle, notifications, onClearNotifications }) => {
  const { user } = useAuth();
  const { activeAccount } = useAccount();
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'WB';
  const [showNotes, setShowNotes] = useState(false);

  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 16,
      padding: '14px 24px',
      borderBottom: `1px solid ${D.hairline}`,
      background: D.bg,
    }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 18, color: D.ink, letterSpacing: '-0.01em' }}>{title}</div>
        {subtitle && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: D.ink50, marginTop: 1 }}>{subtitle}</div>}
      </div>

      <div style={{ flex: 1, maxWidth: 380, marginLeft: 24 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: D.surface, border: `1px solid ${D.hairline}`,
          borderRadius: 10, padding: '8px 12px',
          color: D.ink50,
        }}>
          <NavIcon name="search"/>
          <input
            placeholder="Search ticker, company, sector…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: D.ink, fontFamily: FONT_BODY, fontSize: 13.5,
            }}
          />
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 11, padding: '2px 6px', background: D.surface3, borderRadius: 4, color: D.ink50 }}>⌘K</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {activeAccount && (
          <div style={{ textAlign: 'right', borderRight: `1px solid ${D.hairline}`, paddingRight: 14 }}>
            <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.5 }}>Available</div>
            <div style={{
              fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15, color: D.ink,
              fontVariantNumeric: 'tabular-nums',
            }}>
              {formatAmount(Number(activeAccount.balance) || 0, activeAccount.currency)}
            </div>
          </div>
        )}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowNotes(v => !v)}
            style={{
              background: D.surface, border: `1px solid ${D.hairline}`, color: D.ink70,
              width: 36, height: 36, borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <NavIcon name="bell"/>
            {notifications?.length > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                width: 16, height: 16, borderRadius: 8,
                background: D.sell, color: '#fff',
                fontFamily: FONT_BODY, fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{notifications.length > 9 ? '9+' : notifications.length}</span>
            )}
          </button>
          {showNotes && (
            <div style={{
              position: 'absolute', top: 44, right: 0, zIndex: 200,
              width: 320, maxHeight: 400, overflow: 'auto',
              background: D.surface2, border: `1px solid ${D.hairline}`,
              borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              padding: 8,
            }}>
              {notifications?.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px 4px' }}>
                  <button onClick={onClearNotifications}
                    style={{ background: 'transparent', border: 'none', color: D.ink50, fontFamily: FONT_BODY, fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>
                    Clear all
                  </button>
                </div>
              )}
              {(!notifications || notifications.length === 0) ? (
                <div style={{ padding: '12px 16px', color: D.ink50, fontFamily: FONT_BODY, fontSize: 13 }}>
                  No notifications
                </div>
              ) : notifications.slice().reverse().map((n, i) => (
                <div key={i} style={{
                  padding: '10px 14px', borderRadius: 10, marginBottom: 4,
                  background: D.surface3, borderLeft: `3px solid ${noteColor(n.type)}`,
                }}>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: noteColor(n.type), marginBottom: 2 }}>
                    {n.type?.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: D.ink70 }}>
                    {noteText(n)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <Link to="/profile" title={user?.username || 'Profile'} style={{
          width: 36, height: 36, borderRadius: 18,
          background: `linear-gradient(135deg, ${D.sage}, ${D.teal})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13, color: D.plum,
          textDecoration: 'none',
        }}>{initials}</Link>
      </div>
    </header>
  );
};

export const AppShell = ({ title, subtitle, children }) => {
  const { marketStatus, notifications, setNotifications } = useNotificationsContext();

  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100%',
      background: D.bg, color: D.ink, fontFamily: FONT_BODY,
    }}>
      <Sidebar marketStatus={marketStatus}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          title={title}
          subtitle={subtitle}
          notifications={notifications}
          onClearNotifications={() => setNotifications([])}
        />
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          {children}
        </div>
      </div>
      <ToastStack />
    </div>
  );
};
