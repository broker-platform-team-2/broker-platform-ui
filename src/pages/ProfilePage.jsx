import React, { useState } from 'react';
import { D, FONT_HEAD, FONT_BODY } from '../theme/tokens';
import { AppShell } from '../components/shell/AppShell';
import { Card } from '../components/shared/dark-ui';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../api/auth';
import { passwordChecks, passwordScore, passwordValid } from '../components/auth/ui';

const SectionTitle = ({ title }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 17, color: D.ink, letterSpacing: '-0.01em' }}>{title}</div>
  </div>
);

const FieldRow = ({ label, value, verified }) => (
  <div>
    <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 4 }}>{label}</div>
    <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: D.ink, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
      {value}
      {verified && <span style={{ color: D.sage, fontSize: 12 }}>✓</span>}
    </div>
  </div>
);

const EyeToggle = ({ show, onToggle }) => (
  <button type="button" onClick={onToggle} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: D.ink50, display: 'flex', padding: 4 }}>
    {show
      ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 2l12 12" stroke="currentColor" strokeWidth="1.4"/><path d="M6 6.3a2 2 0 0 0 2.8 2.8M3.5 4.5C2.2 5.7 1.5 8 1.5 8s2.5 4.5 6.5 4.5c1.4 0 2.6-.4 3.6-1M7 3.6c.3 0 .7-.1 1-.1 4 0 6.5 4.5 6.5 4.5s-.6 1-1.6 2.1" stroke="currentColor" strokeWidth="1.4" fill="none"/></svg>
      : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" stroke="currentColor" strokeWidth="1.4"/><circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/></svg>}
  </button>
);

const DarkField = ({ label, error, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 12, color: D.ink50, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: 6, fontFamily: FONT_BODY }}>{label}</div>
    {children}
    {error && <div style={{ fontSize: 12, color: '#FF6B6B', marginTop: 5, fontFamily: FONT_BODY }}>{error}</div>}
  </div>
);

const DarkInput = ({ value, onChange, type = 'text', placeholder, invalid, rightSlot, autoFocus }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: D.surface2,
      border: `1.5px solid ${invalid ? '#FF6B6B' : focused ? D.sage : D.hairline2}`,
      borderRadius: 10, padding: '0 12px', height: 44,
      transition: 'border-color .15s',
    }}>
      <input
        type={type} value={value} autoFocus={autoFocus} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT_BODY, fontSize: 14, color: D.ink, height: '100%' }}
      />
      {rightSlot}
    </div>
  );
};

const DarkStrengthMeter = ({ score, checks }) => {
  const colors = [D.hairline2, '#FF6B6B', D.warn, D.citrus, D.spring, D.sage];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < score ? colors[score] : D.hairline2, transition: 'background .2s' }}/>
        ))}
      </div>
      <div style={{ fontSize: 11, color: D.ink50, display: 'flex', flexWrap: 'wrap', gap: '3px 10px', fontFamily: FONT_BODY }}>
        {[['length','10+ chars'],['upper','Uppercase'],['lower','Lowercase'],['digit','Number'],['symbol','Symbol']].map(([k, label]) => (
          <span key={k} style={{ color: checks[k] ? D.sage : D.ink50, transition: 'color .15s' }}>
            {checks[k] ? '✓ ' : '· '}{label}
          </span>
        ))}
      </div>
    </div>
  );
};

const DarkSpinner = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" style={{ animation: 'wb-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" fill="none" stroke={D.plumDeep} strokeOpacity="0.35" strokeWidth="3"/>
    <path d="M12 3 a9 9 0 0 1 9 9" fill="none" stroke={D.plumDeep} strokeWidth="3" strokeLinecap="round"/>
  </svg>
);

function ChangePasswordModal({ userId, onClose, onSuccess }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const checks = passwordChecks(next);
  const score = passwordScore(next);
  const valid = passwordValid(next) && next === confirm && current.length > 0;

  async function submit(e) {
    e.preventDefault();
    if (!valid) return;
    setError('');
    setLoading(true);
    try {
      await changePassword({ userId, oldPassword: current, newPassword: next });
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div style={{ background: D.surface, border: `1px solid ${D.hairline2}`, borderRadius: 18, padding: '30px 28px', width: 400, maxWidth: '90vw' }}>
        {done ? (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <div style={{ width: 52, height: 52, borderRadius: 26, background: D.sageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 11l4.5 4.5L17 7" stroke={D.sage} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 20, color: D.ink, marginBottom: 8 }}>Password updated</div>
            <div style={{ fontSize: 13.5, color: D.ink50, marginBottom: 24, fontFamily: FONT_BODY }}>Your password has been changed successfully.</div>
            <button
              onClick={onSuccess}
              style={{ background: D.sage, color: D.plumDeep, border: 'none', borderRadius: 10, padding: '10px 32px', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
            >Done</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 18, color: D.ink }}>Change password</div>
              <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: D.ink50, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 2 }}>×</button>
            </div>

            {error && (
              <div style={{ background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#FF6B6B', fontFamily: FONT_BODY }}>
                {error}
              </div>
            )}

            <DarkField label="Current password">
              <DarkInput value={current} onChange={setCurrent} type={showCurrent ? 'text' : 'password'} placeholder="Enter current password" autoFocus
                rightSlot={<EyeToggle show={showCurrent} onToggle={() => setShowCurrent(v => !v)}/>}/>
            </DarkField>

            <DarkField label="New password">
              <DarkInput value={next} onChange={setNext} type={showNext ? 'text' : 'password'} placeholder="Enter new password"
                rightSlot={<EyeToggle show={showNext} onToggle={() => setShowNext(v => !v)}/>}/>
              {next.length > 0 && <DarkStrengthMeter score={score} checks={checks}/>}
            </DarkField>

            <DarkField label="Confirm new password" error={confirm.length > 0 && next !== confirm ? 'Passwords do not match' : ''}>
              <DarkInput value={confirm} onChange={setConfirm} type={showConfirm ? 'text' : 'password'} placeholder="Confirm new password"
                invalid={confirm.length > 0 && next !== confirm}
                rightSlot={<EyeToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)}/>}/>
            </DarkField>

            <button
              type="submit"
              disabled={!valid || loading}
              style={{
                width: '100%', height: 46, marginTop: 4,
                background: valid && !loading ? D.sage : D.surface3,
                color: valid && !loading ? D.plumDeep : D.ink50,
                border: 'none', borderRadius: 12,
                fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15,
                cursor: valid && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background .15s',
              }}
            >
              {loading ? <DarkSpinner/> : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

  return (
    <AppShell title="My Profile" subtitle="Account settings">
      <div>
        {showModal && (
          <ChangePasswordModal
            userId={user?.userId}
            onClose={() => setShowModal(false)}
            onSuccess={() => setShowModal(false)}
          />
        )}
        <Card padding={26}>
          <SectionTitle title="Account details" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <FieldRow label="Username" value={user?.username ? `@${user.username}` : '—'} />
            <FieldRow label="Email" value={user?.email || '—'} verified={!!user?.email} />
            
            <div style={{ borderTop: `1px solid ${D.hairline}`, paddingTop: 24, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, color: D.ink }}>Password</div>
                  <div style={{ fontSize: 12.5, color: D.ink50, marginTop: 3 }}>Change your account password</div>
                </div>
                <button
                  onClick={() => setShowModal(true)}
                  style={{
                    background: 'transparent', border: `1px solid ${D.hairline2}`, color: D.ink,
                    padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                    cursor: 'pointer', fontFamily: FONT_BODY,
                  }}
                >Change password</button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
