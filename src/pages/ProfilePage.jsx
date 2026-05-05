import React, { useState } from 'react';
import { D, FONT_HEAD, FONT_BODY } from '../theme/tokens';
import { AppShell } from '../components/shell/AppShell';
import { Card, Pill } from '../components/shared/dark-ui';
import { useAuth } from '../context/AuthContext';

const SectionTitle = ({ title, action }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
    <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 17, color: D.ink, letterSpacing: '-0.01em' }}>{title}</div>
    {action && <button style={{ background: 'transparent', border: 'none', color: D.sage, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY }}>{action} →</button>}
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

const Stat2 = ({ label, value, tone }) => (
  <div>
    <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>{label}</div>
    <div style={{ fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 16, color: tone || D.ink, marginTop: 4 }}>{value}</div>
  </div>
);

const Mini = ({ label, value }) => (
  <div>
    <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>{label}</div>
    <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, color: D.ink, marginTop: 3 }}>{value}</div>
  </div>
);

const ImpactStat = ({ label, value }) => (
  <div style={{ background: 'rgba(0,0,0,0.22)', borderRadius: 10, padding: 14, border: `1px solid rgba(255,255,255,0.06)` }}>
    <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>{label}</div>
    <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 22, color: D.spring, marginTop: 4, letterSpacing: '-0.02em' }}>{value}</div>
  </div>
);

const ToggleRow = ({ label, subtitle, value, toggle, on, onClick }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${D.hairline}` }}>
    <div>
      <div style={{ fontWeight: 500, color: D.ink, fontSize: 13.5 }}>{label}</div>
      {subtitle && <div style={{ fontSize: 12, color: D.ink50, marginTop: 3 }}>{subtitle}</div>}
    </div>
    {toggle ? (
      <button onClick={onClick} style={{
        width: 38, height: 22, borderRadius: 11, border: 'none',
        background: on ? D.sage : D.surface3, position: 'relative', cursor: 'pointer', padding: 0,
      }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: 9, background: '#fff', transition: 'left .15s' }}/>
      </button>
    ) : value}
  </div>
);

const selectStyle = {
  background: D.surface2, border: `1px solid ${D.hairline}`,
  color: D.ink, borderRadius: 8, padding: '6px 12px', fontFamily: FONT_BODY, fontSize: 13, cursor: 'pointer',
};

function OverviewSection({ user }) {
  return (
    <>
      <Card padding={26}>
        <SectionTitle title="Personal information" action="Edit"/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 22 }}>
          <FieldRow label="Username"      value={user?.username ? `@${user.username}` : '—'}/>
          <FieldRow label="Email"         value={user?.email || '—'} verified={!!user?.email}/>
          <FieldRow label="Full name"     value="Anke Meijer"/>
          <FieldRow label="Phone"         value="+31 6 ···· 4291" verified/>
          <FieldRow label="Date of birth" value="14 Aug 1992"/>
          <FieldRow label="Tax residency" value="Netherlands"/>
          <FieldRow label="Address"       value="Prinsengracht 412, 1016 JZ Amsterdam"/>
          <FieldRow label="Citizenship"   value="Dutch"/>
        </div>
      </Card>


    </>
  );
}

function SecuritySection() {
  return (
    <>
      <Card padding={26}>
        <SectionTitle title="Sign-in & security"/>
        {[
          { name: 'Password',         value: 'Last changed 14 days ago',                      cta: 'Change' },
          { name: 'Two-factor auth',  value: 'Authenticator app · enabled',                   cta: 'Manage', tone: D.sage },
          { name: 'Passkeys',         value: '2 devices · iPhone 15, MacBook Pro',            cta: 'Manage', tone: D.sage },
          { name: 'Recovery codes',   value: '8 of 10 unused',                                cta: 'Regenerate' },
          { name: 'Login alerts',     value: 'Email + push enabled',                          cta: 'Edit',   tone: D.sage },
        ].map((r, i, a) => (
          <div key={r.name} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 0',
            borderBottom: i === a.length - 1 ? 'none' : `1px solid ${D.hairline}`,
          }}>
            <div>
              <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, color: D.ink }}>{r.name}</div>
              <div style={{ fontSize: 12.5, color: r.tone || D.ink50, marginTop: 3 }}>{r.value}</div>
            </div>
            <button style={{
              background: 'transparent', border: `1px solid ${D.hairline2}`, color: D.ink,
              padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
              fontFamily: FONT_BODY,
            }}>{r.cta}</button>
          </div>
        ))}
      </Card>

    </>
  );
}

function PreferencesSection() {
  const [opts, setOpts] = useState({ darkMode: true, sounds: true, defaultOrder: 'LIMIT', baseCcy: 'EUR', emailDigest: 'weekly', priceAlerts: true });
  return (
    <>
      <Card padding={26}>
        <SectionTitle title="Trading defaults"/>
        <ToggleRow label="Default order type" value={
          <select value={opts.defaultOrder} onChange={(e) => setOpts({ ...opts, defaultOrder: e.target.value })} style={selectStyle}>
            <option value="MARKET">Market</option><option value="LIMIT">Limit</option>
          </select>
        }/>

        <ToggleRow label="Confirm before submitting orders" toggle on={true}/>
        <ToggleRow label="Show predicted prices on charts" toggle on={true}/>
      </Card>

      <Card padding={26}>
        <SectionTitle title="Notifications"/>
        <ToggleRow label="Price alerts" toggle on={opts.priceAlerts} onClick={() => setOpts({ ...opts, priceAlerts: !opts.priceAlerts })}/>
        <ToggleRow label="Order fills" toggle on/>
        <ToggleRow label="Deposits & withdrawals" toggle on/>
        <ToggleRow label="Microloan updates" toggle on subtitle="Hear back when a loan you funded gets repaid"/>

      </Card>


    </>
  );
}


const SECTIONS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'security',    label: 'Security' },
  { id: 'preferences', label: 'Preferences' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [section, setSection] = useState('overview');
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'WB';

  return (
    <AppShell title="My Profile" subtitle="Account, security & impact">
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card padding={22} style={{ background: `linear-gradient(160deg, ${D.surface}, ${D.surface2})` }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 14 }}>
              <div style={{
                width: 96, height: 96, borderRadius: 48,
                background: `linear-gradient(135deg, ${D.sage}, ${D.teal})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 32, color: D.plumDeep,
                boxShadow: `0 8px 24px ${D.sage}33`,
              }}>{initials}</div>
              <div>
                <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 20, color: D.ink, letterSpacing: '-0.01em' }}>{user?.username || 'Trader'}</div>
                <div style={{ fontSize: 13, color: D.ink50, marginTop: 3 }}>{user?.email || ''}</div>
              </div>
              <div style={{ width: '100%', borderTop: `1px solid ${D.hairline}`, paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Mini label="Trades" value="184"/>
                <Mini label="Member" value="Mar '26"/>
              </div>
            </div>
          </Card>

          <Card padding={8}>
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setSection(s.id)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 14px', borderRadius: 8,
                background: section === s.id ? D.surface3 : 'transparent',
                color: section === s.id ? D.ink : D.ink70,
                border: 'none', fontFamily: FONT_BODY, fontSize: 13.5,
                fontWeight: section === s.id ? 600 : 500, cursor: 'pointer',
              }}>{s.label}</button>
            ))}
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {section === 'overview'    && <OverviewSection user={user}/>}
          {section === 'security'    && <SecuritySection/>}
          {section === 'preferences' && <PreferencesSection/>}
        </div>
      </div>
    </AppShell>
  );
}
