import React, { useEffect, useMemo, useState } from 'react';
import { D, FONT_HEAD, FONT_BODY } from '../theme/tokens';
import { AppShell } from '../components/shell/AppShell';
import { Card, Pill, AreaChart } from '../components/shared/dark-ui';
import { getMyAccounts, deposit, deduct, createAccount} from '../api/accounts';

// Movements are still mocked — transactions on the backend don't yet carry the
// account-currency mapping. Wire to /transactions once that lands.
const MOVEMENTS_EUR = [
  { id: 'mv1', type: 'DEPOSIT',    amount: +5000.00, source: 'SEPA · ING NL',          status: 'COMPLETED', date: '2026-04-30T09:14:00', currency: 'EUR' },
  { id: 'mv2', type: 'TRADE_BUY',  amount: -2102.40, source: 'Bought 12 ZEDA',         status: 'COMPLETED', date: '2026-04-28T14:32:00', currency: 'EUR' },
  { id: 'mv3', type: 'TRADE_SELL', amount: +3970.00, source: 'Sold 200 KORU',          status: 'COMPLETED', date: '2026-04-28T11:08:00', currency: 'EUR' },
  { id: 'mv4', type: 'FEE',        amount: -2.10,    source: 'Trade fee · ord-3492',   status: 'COMPLETED', date: '2026-04-28T14:32:00', currency: 'EUR' },
  { id: 'mv5', type: 'DEPOSIT',    amount: +2500.00, source: 'SEPA · ING NL',          status: 'COMPLETED', date: '2026-04-22T11:00:00', currency: 'EUR' },
  { id: 'mv6', type: 'WITHDRAWAL', amount: -800.00,  source: 'To NL12 INGB ··· 4421',  status: 'PENDING',   date: '2026-05-02T16:42:00', currency: 'EUR' },
  { id: 'mv7', type: 'TRANSFER',   amount: -1000.00, source: 'To RON wallet',          status: 'COMPLETED', date: '2026-04-15T10:00:00', currency: 'EUR' },
];
const MOVEMENTS_RON = [
  { id: 'rn1', type: 'TRANSFER', amount: +4950.00, source: 'From EUR @ 4.95',       status: 'COMPLETED', date: '2026-04-15T10:00:00', currency: 'RON' },
  { id: 'rn2', type: 'DEPOSIT',  amount: +4000.00, source: 'BCR · IBAN ··· 1287',   status: 'COMPLETED', date: '2026-03-20T14:18:00', currency: 'RON' },
];
const MOVEMENTS_BY_CURRENCY = { EUR: MOVEMENTS_EUR, RON: MOVEMENTS_RON };

const TYPE_LABEL = {
  DEPOSIT: 'Deposit', WITHDRAWAL: 'Withdrawal', TRADE_BUY: 'Buy', TRADE_SELL: 'Sell', FEE: 'Fee', TRANSFER: 'Transfer',
};

const CURRENCY_LABEL = {
  EUR: 'Euro',
  RON: 'Romanian leu',
  USD: 'US Dollar',
  GBP: 'British Pound',
  CHF: 'Swiss Franc',
};

const SYMBOL = { EUR: '€', RON: 'lei ', USD: '$', GBP: '£', CHF: 'CHF ' };

const CASHFLOW = [3200,3100,3500,3400,4800,4700,5100,5050,5200,4900,5400,5800,6100,5950,6400,6800,7200,7050,7600,8200,8100,8900,9300,9100,9800,10500,10400,11200,11800,12400,13100,14000,14800,15200,16100,16800,17400,17900,18420];

function ibanLast4(accountId) {
  // Decorative "··· 4421" suffix derived from accountId so each card looks unique.
  return String(1000 + (Number(accountId) || 0) * 421 % 9000).slice(-4);
}

export default function WalletPage() {
  const [accounts, setAccounts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await getMyAccounts();
        setAccounts(list);
        if (list.length > 0) {
          // Default to EUR if present, else the first (oldest) account.
          const primary = list.find(a => a.currency === 'EUR') || list[0];
          setActiveId(primary.accountId);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const balances = useMemo(
    () => accounts.map(a => ({ currency: a.currency, available: Number(a.balance) || 0 })),
    [accounts]
  );

  const account = accounts.find(a => a.accountId === activeId) || accounts[0];
  const activeCurrency = account?.currency || 'EUR';
  const sym = SYMBOL[activeCurrency] || `${activeCurrency} `;

  const movementsForCurrency = MOVEMENTS_BY_CURRENCY[activeCurrency] || [];
  const movements = movementsForCurrency.filter(m => {
    if (tab === 'all')  return true;
    if (tab === 'in')   return m.amount > 0;
    if (tab === 'out')  return m.amount < 0;
    if (tab === 'fees') return m.type === 'FEE';
    return true;
  });

  const handleDeposit = async () => {
    // 1. Ask for amount (you could also create a custom Model component for this)
    const amountStr = window.prompt(`How much ${activeCurrency} would you like to deposit?`);
    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    try {
      setLoading(true); // Optional: show loading state
      await deposit(activeCurrency, amount);

      // 2. Refresh the account list to show the new balance
      const updatedAccounts = await getMyAccounts();
      setAccounts(updatedAccounts);

      alert(`Successfully deposited ${SYMBOL[activeCurrency]}${amount}`);
    } catch (error) {
      console.error("Deposit failed:", error);
      alert("Transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const currentBalance = Number(account?.balance) || 0;
    const amountStr = window.prompt(`Withdraw from ${activeCurrency} (Available: ${sym}${currentBalance.toLocaleString()})`);
    const amount = parseFloat(amountStr);

    // Validation
    if (isNaN(amount) || amount <= 0) return;

    if (amount > currentBalance) {
      alert("Insufficient funds for this withdrawal.");
      return;
    }

    try {
      setLoading(true);
      await deduct(activeCurrency, amount);

      // Refresh accounts to show updated balance
      const updatedAccounts = await getMyAccounts();
      setAccounts(updatedAccounts);

      alert(`Successfully withdrew ${sym}${amount}`);
    } catch (error) {
      console.error("Withdrawal failed:", error);
      alert("Transaction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCurrency = async () => {
    const currency = window.prompt("Enter currency (USD, GBP, CHF):")?.toUpperCase();

    if (!currency) return;

    try {
      setLoading(true);
      await createAccount(currency);

      // Refresh the account list so the new card appears immediately
      const updated = await getMyAccounts();
      setAccounts(updated);
    } catch (err) {
      console.error("Failed to create account:", err);
      alert("Could not create account. It may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell title="Wallet" subtitle="Accounts, deposits & transfers" balances={balances}>
      {/* Account cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
        {accounts.map((a, i) => {
          const sel = a.accountId === activeId;
          const isPrimary = i === 0;
          const isEur = a.currency === 'EUR';
          const balance = Number(a.balance) || 0;
          const frozen = Number(a.frozenBalance) || 0;
          const labelTone = isPrimary ? 'Primary' : 'Secondary';
          return (
            <button key={a.accountId} onClick={() => setActiveId(a.accountId)} style={{
              textAlign: 'left', cursor: 'pointer',
              background: sel
                ? `linear-gradient(135deg, ${D.sage} 0%, ${D.teal} 100%)`
                : D.surface,
              border: `1px solid ${sel ? 'transparent' : D.hairline}`,
              borderRadius: 16, padding: 22,
              color: sel ? (D.plumDeep) : D.ink,
              position: 'relative', overflow: 'hidden',
              fontFamily: FONT_BODY,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                <div>
                  <div style={{ fontSize: 11, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>
                    {CURRENCY_LABEL[a.currency] || a.currency}
                  </div>
                  <div style={{ fontFamily: FONT_HEAD, fontWeight: 600, fontSize: 14, marginTop: 4 }}>
                    NL98 WAKB ···· {ibanLast4(a.accountId)}
                  </div>
                </div>
                <div style={{
                  padding: '4px 10px', background: sel ? 'rgba(0,0,0,0.18)' : D.surface3,
                  borderRadius: 999, fontSize: 11, fontWeight: 700,
                }}>{a.currency}</div>
              </div>
              <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 30, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                {SYMBOL[a.currency] || `${a.currency} `}{balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              {frozen > 0 && (
                <div style={{ fontSize: 11.5, opacity: 0.78, marginTop: 6 }}>
                  {SYMBOL[a.currency] || `${a.currency} `}{frozen.toFixed(2)} frozen in open orders
                </div>
              )}
            </button>
          );
        })}

        {!loading && accounts.length === 0 && (
          <div style={{
            gridColumn: 'span 3',
            background: D.surface, border: `1px solid ${D.hairline}`,
            borderRadius: 16, padding: 22, color: D.ink50, textAlign: 'center', fontSize: 13,
          }}>
            No accounts found. Sign out and back in, or contact support if this persists.
          </div>
        )}

        <button
            onClick={handleAddCurrency}
            style={{
          background: 'transparent', border: `1px dashed ${D.hairline2}`,
          borderRadius: 16, padding: 22, color: D.ink70, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontFamily: FONT_BODY,
        }}>
          <span style={{ fontSize: 22, color: D.sage }}>+</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Add currency</span>
          <span style={{ fontSize: 11, color: D.ink50 }}>USD, GBP, CHF available</span>
        </button>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        {[
          { id: 'deposit',  label: 'Deposit',     icon: '↓', primary: true, action: handleDeposit },
          { id: 'withdraw', label: 'Withdraw',    icon: '↑', action: handleWithdraw },
        ].map(a => (
            <button
                key={a.id}
                onClick={a.action}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 18px',
                  background: a.primary ? D.sage : D.surface,
                  color: a.primary ? D.plumDeep : D.ink,
                  border: a.primary ? 'none' : `1px solid ${D.hairline}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontFamily: FONT_BODY,
                  fontWeight: 600,
                  fontSize: 13.5,
                }}
            >
              <span style={{ fontSize: 16 }}>{a.icon}</span>
              {a.label}
            </button>
        ))}
      </div>

      {/* Cashflow + monthly summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 18, marginBottom: 18 }}>
        <Card padding={22}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, color: D.ink, letterSpacing: '-0.01em' }}>Account balance · 30 days</div>
              <div style={{ fontSize: 12, color: D.ink50, marginTop: 3 }}>Net cash position over time</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 22, color: D.ink, letterSpacing: '-0.02em' }}>
                {sym}{(Number(account?.balance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
          <div style={{ marginLeft: -8, marginRight: -8 }}>
            <AreaChart data={CASHFLOW} height={180} color={D.sage}/>
          </div>
        </Card>
        {/*<Card padding={22} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>*/}
        {/*  <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, color: D.ink, letterSpacing: '-0.01em' }}>This month</div>*/}
        {/*  {[*/}
        {/*    { label: 'Deposits',    value: '+€7,500.00', tone: D.buy },*/}
        {/*    { label: 'Withdrawals', value: '−€800.00',   tone: D.ink70 },*/}
        {/*    { label: 'Trade flow',  value: '+€1,867.60', tone: D.buy },*/}
        {/*    { label: 'Fees',        value: '−€11.95',    tone: D.warn, hint: '→ funded €2.40 in microloans' },*/}
        {/*  ].map(r => (*/}
        {/*    <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `1px solid ${D.hairline}`, paddingBottom: 12 }}>*/}
        {/*      <div>*/}
        {/*        <div style={{ fontSize: 12.5, color: D.ink70 }}>{r.label}</div>*/}
        {/*        {r.hint && <div style={{ fontSize: 11, color: D.spring, marginTop: 2 }}>{r.hint}</div>}*/}
        {/*      </div>*/}
        {/*      <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15, color: r.tone, fontVariantNumeric: 'tabular-nums' }}>{r.value}</div>*/}
        {/*    </div>*/}
        {/*  ))}*/}
        {/*</Card>*/}
      </div>

      {/* Movements */}
      <Card padding={0}>
        <div style={{ padding: '18px 22px', borderBottom: `1px solid ${D.hairline}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, color: D.ink, letterSpacing: '-0.01em' }}>Movements</div>
            <div style={{ fontSize: 12, color: D.ink50, marginTop: 2 }}>{movements.length} entries · {activeCurrency}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[['all', 'All'], ['in', 'Money in'], ['out', 'Money out'], ['fees', 'Fees']].map(([id, l]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                background: tab === id ? D.surface3 : 'transparent', border: 'none',
                color: tab === id ? D.ink : D.ink50,
                padding: '6px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: FONT_BODY,
              }}>{l}</button>
            ))}
          </div>
        </div>

        {movements.length === 0 && (
          <div style={{ padding: '40px 22px', textAlign: 'center', color: D.ink50, fontSize: 13 }}>
            No movements for this account yet.
          </div>
        )}

        {movements.map((m, i) => {
          const isIn = m.amount > 0;
          const mSym = SYMBOL[m.currency] || `${m.currency} `;
          const icon = m.type === 'DEPOSIT' ? '↓' : m.type === 'WITHDRAWAL' ? '↑' : m.type === 'FEE' ? '◇' : m.type === 'TRANSFER' ? '⇌' : isIn ? '↙' : '↗';
          return (
            <div key={m.id} style={{
              display: 'grid', gridTemplateColumns: '40px 1.4fr 1fr 1fr 1fr',
              padding: '14px 22px', alignItems: 'center', gap: 14,
              borderBottom: i === movements.length - 1 ? 'none' : `1px solid ${D.hairline}`,
              fontFamily: FONT_BODY, fontSize: 13,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: m.type === 'FEE' ? D.warnBg : isIn ? D.buyBg : 'rgba(255,255,255,0.06)',
                color: m.type === 'FEE' ? D.warn : isIn ? D.buy : D.ink70,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>{icon}</div>
              <div>
                <div style={{ color: D.ink, fontWeight: 600 }}>{TYPE_LABEL[m.type]}</div>
                <div style={{ fontSize: 11.5, color: D.ink50, marginTop: 1 }}>{m.source}</div>
              </div>
              <div style={{ color: D.ink70, fontSize: 12 }}>
                {new Date(m.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}<br/>
                <span style={{ fontSize: 11, color: D.ink50 }}>{new Date(m.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div>
                <Pill
                  color={m.status === 'COMPLETED' ? D.sage : D.warn}
                  bg={m.status === 'COMPLETED' ? D.sageBg : D.warnBg}
                >{m.status}</Pill>
              </div>
              <div style={{ textAlign: 'right', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15,
                color: isIn ? D.buy : D.ink, fontVariantNumeric: 'tabular-nums' }}>
                {isIn ? '+' : '−'}{mSym}{Math.abs(m.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          );
        })}
      </Card>
    </AppShell>
  );
}
