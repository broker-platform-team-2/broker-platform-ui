import React, { useState } from 'react';
import { D, FONT_HEAD, FONT_BODY } from '../theme/tokens';
import { AppShell } from '../components/shell/AppShell';
import { Card, Pill } from '../components/shared/dark-ui';
import { ACCOUNTS } from '../data/mockAccounts';
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

      <Card padding={26}>
        <SectionTitle title="Trading profile" action="Update"/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
          <Stat2 label="Risk tolerance"  value="Moderate" tone={D.sage}/>
          <Stat2 label="Experience"      value="3+ years"/>
          <Stat2 label="Knowledge"       value="Advanced"/>
          <Stat2 label="Annual income"   value="€60–80k"/>
          <Stat2 label="Net worth"       value="€100–250k"/>
          <Stat2 label="Source of funds" value="Salary"/>
          <Stat2 label="Options access"  value="Level 2" tone={D.spring}/>
          <Stat2 label="Margin"          value="Disabled" tone={D.ink70}/>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Card padding={22} style={{ background: `linear-gradient(135deg, ${D.plum}, ${D.plumDeep})`, borderColor: 'transparent' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Lifetime impact</div>
          <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 32, color: '#fff', letterSpacing: '-0.02em', marginTop: 8 }}>€428.40</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.78)', marginTop: 6 }}>across <strong style={{ color: D.spring }}>11 microloans</strong> in 7 countries</div>
        </Card>
        <Card padding={22}>
          <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Account tier</div>
          <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 22, color: D.ink, letterSpacing: '-0.02em', marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
            Tier 2 · Verified <span style={{ fontSize: 13, color: D.spring, fontWeight: 600 }}>↑ Tier 3 in 16 trades</span>
          </div>
          <div style={{ height: 6, background: D.surface2, borderRadius: 3, marginTop: 12, overflow: 'hidden' }}>
            <div style={{ width: '92%', height: '100%', background: `linear-gradient(90deg, ${D.sage}, ${D.spring})` }}/>
          </div>
          <div style={{ fontSize: 12, color: D.ink70, marginTop: 10 }}>Higher tiers unlock options Level 3, lower fees, and priority support.</div>
        </Card>
      </div>
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

      <Card padding={26}>
        <SectionTitle title="Active sessions" action="Sign out all"/>
        {[
          { device: 'MacBook Pro · Chrome',     loc: 'Amsterdam, NL', when: 'Now · this session', current: true },
          { device: 'iPhone 15 · Wakibi app',   loc: 'Amsterdam, NL', when: '2 hours ago' },
          { device: 'iPad · Safari',            loc: 'Utrecht, NL',   when: 'Yesterday' },
        ].map((s, i, a) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 0',
            borderBottom: i === a.length - 1 ? 'none' : `1px solid ${D.hairline}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: D.surface2, color: D.ink70, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>◰</div>
              <div>
                <div style={{ fontWeight: 600, color: D.ink, fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {s.device}
                  {s.current && <Pill color={D.sage} bg={D.sageBg}>This device</Pill>}
                </div>
                <div style={{ fontSize: 12, color: D.ink50, marginTop: 2 }}>{s.loc} · {s.when}</div>
              </div>
            </div>
            {!s.current && <button style={{ background: 'transparent', border: 'none', color: D.sell, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Sign out</button>}
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
        <ToggleRow label="Base currency" value={
          <select value={opts.baseCcy} onChange={(e) => setOpts({ ...opts, baseCcy: e.target.value })} style={selectStyle}>
            <option value="EUR">EUR</option><option value="RON">RON</option>
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
        <ToggleRow label="Weekly market digest" value={
          <select value={opts.emailDigest} onChange={(e) => setOpts({ ...opts, emailDigest: e.target.value })} style={selectStyle}>
            <option value="never">Never</option><option value="weekly">Mondays</option><option value="daily">Daily</option>
          </select>
        }/>
      </Card>

      <Card padding={26}>
        <SectionTitle title="Appearance"/>
        <ToggleRow label="Dark mode" toggle on={opts.darkMode} onClick={() => setOpts({ ...opts, darkMode: !opts.darkMode })}/>
        <ToggleRow label="UI sounds" toggle on={opts.sounds} onClick={() => setOpts({ ...opts, sounds: !opts.sounds })}/>
        <ToggleRow label="Reduce motion" toggle on={false}/>
      </Card>
    </>
  );
}

function ImpactSection() {
  const loans = [
    { name: 'Amina',  role: 'Maize farmer',     country: 'Kenya',     funded: '€42.10', pct: 78,  status: 'Active' },
    { name: 'Diego',  role: 'Bike repair shop', country: 'Peru',      funded: '€28.40', pct: 45,  status: 'Active' },
    { name: 'Linh',   role: 'Tailor co-op',     country: 'Vietnam',   funded: '€64.80', pct: 92,  status: 'Active' },
    { name: 'Carlos', role: 'Coffee roaster',   country: 'Honduras',  funded: '€38.20', pct: 100, status: 'Repaid' },
    { name: 'Fatima', role: 'Solar kiosk',      country: 'Senegal',   funded: '€55.00', pct: 100, status: 'Repaid' },
    { name: 'Priya',  role: 'Textile workshop', country: 'India',     funded: '€81.50', pct: 100, status: 'Repaid' },
  ];
  return (
    <>
      <Card padding={26} style={{ background: `linear-gradient(135deg, ${D.plum} 0%, ${D.plumDeep} 100%)`, borderColor: 'transparent' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 32, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, color: D.spring, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Your Wakibi loop</div>
            <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 38, color: '#fff', letterSpacing: '-0.02em', marginTop: 12, lineHeight: 1.1 }}>
              €428.40 set things in motion.
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.78)', marginTop: 12, lineHeight: 1.55 }}>
              Since March, every fee you've paid has gone toward microloans. 11 entrepreneurs received your support across 7 countries. 3 have already repaid in full.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <ImpactStat label="Lifetime"  value="€428.40"/>
            <ImpactStat label="Loans"     value="11"/>
            <ImpactStat label="Countries" value="7"/>
            <ImpactStat label="Repaid"    value="3"/>
          </div>
        </div>
      </Card>

      <Card padding={0}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${D.hairline}` }}>
          <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, color: D.ink, letterSpacing: '-0.01em' }}>Loans you've funded</div>
          <div style={{ fontSize: 12, color: D.ink50, marginTop: 2 }}>{loans.length} active and repaid</div>
        </div>
        {loans.map((l, i) => (
          <div key={l.name} style={{
            display: 'grid', gridTemplateColumns: '48px 1.5fr 1fr 1fr 100px',
            padding: '14px 22px', alignItems: 'center', gap: 14,
            borderBottom: i === loans.length - 1 ? 'none' : `1px solid ${D.hairline}`,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 22,
              background: `linear-gradient(135deg, ${D.spring}, ${D.citrus})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: D.plumDeep, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14,
            }}>{l.name[0]}</div>
            <div>
              <div style={{ fontWeight: 600, color: D.ink, fontSize: 13.5 }}>{l.name}</div>
              <div style={{ fontSize: 12, color: D.ink50, marginTop: 2 }}>{l.role} · {l.country}</div>
            </div>
            <div>
              <div style={{ height: 5, background: D.surface2, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: l.pct + '%', height: '100%', background: l.pct === 100 ? D.sage : D.spring }}/>
              </div>
              <div style={{ fontSize: 11, color: D.ink50, marginTop: 4 }}>{l.pct}% repaid</div>
            </div>
            <div><Pill color={l.status === 'Repaid' ? D.sage : D.spring} bg={l.status === 'Repaid' ? D.sageBg : 'rgba(168,214,112,0.14)'}>{l.status}</Pill></div>
            <div style={{ textAlign: 'right', fontFamily: FONT_HEAD, fontWeight: 700, color: D.spring, fontSize: 15, fontVariantNumeric: 'tabular-nums' }}>{l.funded}</div>
          </div>
        ))}
      </Card>
    </>
  );
}

function TaxSection() {
  return (
    <Card padding={26}>
      <SectionTitle title="Tax & documents"/>
      {[
        { name: '2025 Annual tax statement', size: 'PDF · 124 KB', when: 'Issued 12 Feb 2026' },
        { name: 'Q1 2026 trading summary',   size: 'CSV · 18 KB',  when: 'Issued 02 Apr 2026' },
        { name: 'KYC verification report',   size: 'PDF · 2.1 MB', when: 'Issued 08 Mar 2026' },
        { name: 'Account terms (signed)',    size: 'PDF · 240 KB', when: 'Issued 08 Mar 2026' },
      ].map((d, i, a) => (
        <div key={d.name} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 0', borderBottom: i === a.length - 1 ? 'none' : `1px solid ${D.hairline}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: D.surface2, color: D.ink70, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>PDF</div>
            <div>
              <div style={{ fontWeight: 600, color: D.ink, fontSize: 13.5 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: D.ink50, marginTop: 2 }}>{d.size} · {d.when}</div>
            </div>
          </div>
          <button style={{ background: 'transparent', border: `1px solid ${D.hairline2}`, color: D.ink, padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY }}>Download</button>
        </div>
      ))}
    </Card>
  );
}

const SECTIONS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'security',    label: 'Security' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'impact',      label: 'Impact' },
  { id: 'tax',         label: 'Tax & documents' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [section, setSection] = useState('overview');
  const eurBalance = ACCOUNTS.find(a => a.currency === 'EUR').balance;
  const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'WB';

  return (
    <AppShell title="My Profile" subtitle="Account, security & impact" balance={eurBalance}>
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
              <Pill color={D.sage} bg={D.sageBg} size="md">✓ Verified · Tier 2</Pill>
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
          {section === 'impact'      && <ImpactSection/>}
          {section === 'tax'         && <TaxSection/>}
        </div>
      </div>
    </AppShell>
  );
}
