import React, { useEffect, useRef, useState } from 'react';
import { D, FONT_HEAD, FONT_BODY } from '../theme/tokens';
import { AppShell } from '../components/shell/AppShell';
import { Card, Pill, AreaChart } from '../components/shared/dark-ui';
import { deposit, deduct, createAccount } from '../api/accounts';
import { useAccount } from '../context/AccountContext';

function FundsModal({ mode, account, onConfirm, onClose }) {
  const isDeposit = mode === 'deposit';
  const sym = SYMBOL[account?.currency] || `${account?.currency} `;
  const available = Number(account?.balance) || 0;

  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const amount = parseFloat(value);
  const overdrawn = !isDeposit && !isNaN(amount) && amount > available;

  const handleConfirm = async () => {
    if (isNaN(amount) || amount <= 0) { setError('Enter a valid amount.'); return; }
    if (overdrawn) { setError('Amount exceeds available balance.'); return; }
    setError('');
    setBusy(true);
    try {
      await onConfirm(amount);
      setDone(true);
      setTimeout(onClose, 1400);
    } catch {
      setError('Transaction failed. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(26,14,22,0.80)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 420, background: D.surface,
          border: `1px solid ${D.hairline2}`,
          borderRadius: 20, padding: 28,
          fontFamily: FONT_BODY,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: isDeposit ? D.buyBg : D.sellBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, color: isDeposit ? D.buy : D.sell,
          }}>
            {isDeposit ? '↓' : '↑'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 18, color: D.ink, letterSpacing: '-0.01em' }}>
              {isDeposit ? 'Deposit funds' : 'Withdraw funds'}
            </div>
            <div style={{ fontSize: 12, color: D.ink50, marginTop: 2 }}>
              {CURRENCY_LABEL[account?.currency]} · NL98 WAKB ···· {ibanLast4(account?.accountId)}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: D.surface2, border: `1px solid ${D.hairline}`,
              color: D.ink50, width: 32, height: 32, borderRadius: 8,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Available balance row (withdraw only) */}
        {!isDeposit && (
          <div style={{
            background: D.surface2, borderRadius: 10, padding: '10px 14px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 16, border: `1px solid ${D.hairline}`,
          }}>
            <span style={{ fontSize: 12, color: D.ink50 }}>Available balance</span>
            <span style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15, color: D.ink, fontVariantNumeric: 'tabular-nums' }}>
              {sym}{available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        )}

        {/* Amount input */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 8 }}>Amount</div>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: D.surface2,
            border: `1px solid ${overdrawn || (error && (isNaN(amount) || amount <= 0)) ? D.sell : D.hairline2}`,
            borderRadius: 12, padding: '0 16px',
            transition: 'border-color 0.15s',
          }}>
            <span style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 20, color: D.ink50, marginRight: 4, userSelect: 'none' }}>
              {sym}
            </span>
            <input
              ref={inputRef}
              type="number"
              min="0.01"
              step="0.01"
              value={value}
              onChange={e => { setValue(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirm(); }}
              placeholder="0.00"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 32, color: D.ink,
                padding: '16px 0', fontVariantNumeric: 'tabular-nums',
              }}
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ fontSize: 12, color: D.sell, marginBottom: 12, paddingLeft: 2 }}>{error}</div>
        )}

        {/* Success banner */}
        {done && (
          <div style={{
            background: D.buyBg, border: `1px solid rgba(89,191,138,0.3)`,
            borderRadius: 10, padding: '10px 14px', marginTop: 8, marginBottom: 4,
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 600, color: D.buy,
          }}>
            ✓ {isDeposit ? 'Deposit' : 'Withdrawal'} successful
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '13px 0',
              background: 'transparent', border: `1px solid ${D.hairline2}`,
              borderRadius: 10, color: D.ink70,
              fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14,
              cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={busy || done}
            style={{
              flex: 2, padding: '13px 0',
              background: isDeposit
                ? `linear-gradient(135deg, ${D.sage} 0%, ${D.teal} 100%)`
                : `linear-gradient(135deg, ${D.sell} 0%, #ff9b9b 100%)`,
              border: 'none', borderRadius: 10,
              color: isDeposit ? D.plumDeep : '#fff',
              fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14,
              cursor: busy || done ? 'default' : 'pointer',
              opacity: busy ? 0.65 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {busy ? 'Processing…' : done ? 'Done' : isDeposit ? `Deposit ${account?.currency}` : `Withdraw ${account?.currency}`}
          </button>
        </div>
      </div>
    </div>
  );
}

const ALL_CURRENCIES = [
  { code: 'EUR', name: 'Euro',              symbol: '€'   },
  { code: 'USD', name: 'US Dollar',         symbol: '$'   },
  { code: 'GBP', name: 'British Pound',     symbol: '£'   },
  { code: 'CHF', name: 'Swiss Franc',       symbol: 'CHF' },
  { code: 'JPY', name: 'Japanese Yen',      symbol: '¥'   },
  { code: 'CAD', name: 'Canadian Dollar',   symbol: 'C$'  },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$'  },
  { code: 'NZD', name: 'New Zealand Dollar',symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona',     symbol: 'kr'  },
  { code: 'NOK', name: 'Norwegian Krone',   symbol: 'kr'  },
  { code: 'DKK', name: 'Danish Krone',      symbol: 'kr'  },
  { code: 'HKD', name: 'Hong Kong Dollar',  symbol: 'HK$' },
  { code: 'SGD', name: 'Singapore Dollar',  symbol: 'S$'  },
  { code: 'CNY', name: 'Chinese Yuan',      symbol: '¥'   },
  { code: 'INR', name: 'Indian Rupee',      symbol: '₹'   },
  { code: 'KRW', name: 'South Korean Won',  symbol: '₩'   },
  { code: 'BRL', name: 'Brazilian Real',    symbol: 'R$'  },
  { code: 'MXN', name: 'Mexican Peso',      symbol: 'MX$' },
  { code: 'ZAR', name: 'South African Rand',symbol: 'R'   },
  { code: 'TRY', name: 'Turkish Lira',      symbol: '₺'   },
  { code: 'PLN', name: 'Polish Zloty',      symbol: 'zł'  },
  { code: 'RON', name: 'Romanian Leu',      symbol: 'lei' },
];

function AddAccountModal({ existingCurrencies, onConfirm, onClose }) {
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleConfirm = async () => {
    if (!selected) return;
    setError('');
    setBusy(true);
    try {
      await onConfirm(selected);
      setDone(true);
      setTimeout(onClose, 1400);
    } catch {
      setError('Could not create account. It may already exist.');
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(26,14,22,0.80)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 460, background: D.surface,
          border: `1px solid ${D.hairline2}`,
          borderRadius: 20, padding: 28,
          fontFamily: FONT_BODY,
          boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: D.sageBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, color: D.sage,
          }}>+</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 18, color: D.ink, letterSpacing: '-0.01em' }}>
              Add account
            </div>
            <div style={{ fontSize: 12, color: D.ink50, marginTop: 2 }}>
              Select a currency to open a new wallet account
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: D.surface2, border: `1px solid ${D.hairline}`,
              color: D.ink50, width: 32, height: 32, borderRadius: 8,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* Currency grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20, maxHeight: 320, overflowY: 'auto', paddingRight: 2 }}>
          {ALL_CURRENCIES.map(c => {
            const exists = existingCurrencies.includes(c.code);
            const isSelected = selected === c.code;
            return (
              <button
                key={c.code}
                disabled={exists}
                onClick={() => !exists && setSelected(c.code)}
                style={{
                  textAlign: 'left', cursor: exists ? 'default' : 'pointer',
                  background: isSelected ? D.sageBg : D.surface2,
                  border: `1px solid ${isSelected ? D.sage : D.hairline}`,
                  borderRadius: 12, padding: '14px 16px',
                  opacity: exists ? 0.45 : 1,
                  transition: 'border-color 0.15s, background 0.15s',
                  fontFamily: FONT_BODY,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 22,
                    color: isSelected ? D.sage : D.ink,
                    letterSpacing: '-0.01em',
                  }}>{c.symbol}</div>
                  {exists
                    ? <span style={{ fontSize: 10, fontWeight: 700, color: D.ink50, background: D.surface3, padding: '2px 7px', borderRadius: 999 }}>ADDED</span>
                    : isSelected && <span style={{ fontSize: 10, fontWeight: 700, color: D.sage, background: D.sageBg, padding: '2px 7px', borderRadius: 999 }}>SELECTED</span>
                  }
                </div>
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? D.ink : D.ink70 }}>{c.code}</div>
                  <div style={{ fontSize: 11, color: D.ink50, marginTop: 1 }}>{c.name}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div style={{ fontSize: 12, color: D.sell, marginBottom: 12, paddingLeft: 2 }}>{error}</div>
        )}

        {/* Success banner */}
        {done && (
          <div style={{
            background: D.buyBg, border: `1px solid rgba(89,191,138,0.3)`,
            borderRadius: 10, padding: '10px 14px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 13, fontWeight: 600, color: D.buy,
          }}>
            ✓ Account created
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '13px 0',
              background: 'transparent', border: `1px solid ${D.hairline2}`,
              borderRadius: 10, color: D.ink70,
              fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14,
              cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!selected || busy || done}
            style={{
              flex: 2, padding: '13px 0',
              background: selected && !busy && !done
                ? `linear-gradient(135deg, ${D.sage} 0%, ${D.teal} 100%)`
                : D.surface3,
              border: 'none', borderRadius: 10,
              color: selected && !busy && !done ? D.plumDeep : D.ink50,
              fontFamily: FONT_BODY, fontWeight: 700, fontSize: 14,
              cursor: !selected || busy || done ? 'default' : 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {busy ? 'Creating…' : done ? 'Done' : selected ? `Open ${selected} Account` : 'Select a currency'}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  EUR: 'Euro',           USD: 'US Dollar',         GBP: 'British Pound',
  CHF: 'Swiss Franc',    JPY: 'Japanese Yen',       CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar', NZD: 'New Zealand Dollar', SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone', DKK: 'Danish Krone',      HKD: 'Hong Kong Dollar',
  SGD: 'Singapore Dollar', CNY: 'Chinese Yuan',     INR: 'Indian Rupee',
  KRW: 'South Korean Won', BRL: 'Brazilian Real',   MXN: 'Mexican Peso',
  ZAR: 'South African Rand', TRY: 'Turkish Lira',   PLN: 'Polish Zloty',
  RON: 'Romanian Leu',
};

const SYMBOL = {
  EUR: '€',  USD: '$',   GBP: '£',   CHF: 'CHF ', JPY: '¥',
  CAD: 'C$', AUD: 'A$',  NZD: 'NZ$', SEK: 'kr ',  NOK: 'kr ',
  DKK: 'kr ', HKD: 'HK$', SGD: 'S$', CNY: '¥',    INR: '₹',
  KRW: '₩',  BRL: 'R$',  MXN: 'MX$', ZAR: 'R ',  TRY: '₺',
  PLN: 'zł ', RON: 'lei ',
};

const CASHFLOW = [3200,3100,3500,3400,4800,4700,5100,5050,5200,4900,5400,5800,6100,5950,6400,6800,7200,7050,7600,8200,8100,8900,9300,9100,9800,10500,10400,11200,11800,12400,13100,14000,14800,15200,16100,16800,17400,17900,18420];

function ibanLast4(accountId) {
  // Decorative "··· 4421" suffix derived from accountId so each card looks unique.
  return String(1000 + (Number(accountId) || 0) * 421 % 9000).slice(-4);
}

export default function WalletPage() {
  const { accounts, activeId, setActiveId, refreshAccounts } = useAccount();
  const [tab, setTab] = useState('all');
  const [modal, setModal] = useState(null); // 'deposit' | 'withdraw' | 'add' | null

  const account = accounts.find(a => String(a.accountId) === String(activeId)) || accounts[0];
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

  const handleDepositConfirm = async (amount) => {
    await deposit(activeCurrency, amount);
    await refreshAccounts();
  };

  const handleWithdrawConfirm = async (amount) => {
    await deduct(activeCurrency, amount);
    await refreshAccounts();
  };

  const handleAddAccountConfirm = async (currency) => {
    await createAccount(currency);
    await refreshAccounts();
  };

  return (
    <AppShell title="Wallet" subtitle="Accounts, deposits & transfers">
      {(modal === 'deposit' || modal === 'withdraw') && (
        <FundsModal
          mode={modal}
          account={account}
          onConfirm={modal === 'deposit' ? handleDepositConfirm : handleWithdrawConfirm}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'add' && (
        <AddAccountModal
          existingCurrencies={accounts.map(a => a.currency)}
          onConfirm={handleAddAccountConfirm}
          onClose={() => setModal(null)}
        />
      )}
      {/* Account cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 18 }}>
        {accounts.map((a, i) => {
          const sel = String(a.accountId) === String(activeId);
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

        {accounts.length === 0 && (
          <div style={{
            gridColumn: 'span 3',
            background: D.surface, border: `1px solid ${D.hairline}`,
            borderRadius: 16, padding: 22, color: D.ink50, textAlign: 'center', fontSize: 13,
          }}>
            No accounts found. Sign out and back in, or contact support if this persists.
          </div>
        )}

        <button
            onClick={() => setModal('add')}
            style={{
          background: 'transparent', border: `1px dashed ${D.hairline2}`,
          borderRadius: 16, padding: 22, color: D.ink70, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
          fontFamily: FONT_BODY,
        }}>
          <span style={{ fontSize: 22, color: D.sage }}>+</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Add account</span>
          <span style={{ fontSize: 11, color: D.ink50 }}>USD, GBP, CHF available</span>
        </button>
      </div>

      {/* Quick actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
        {[
          { id: 'deposit',  label: 'Deposit',  icon: '↓', primary: true, action: () => setModal('deposit') },
          { id: 'withdraw', label: 'Withdraw', icon: '↑', action: () => setModal('withdraw') },
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
