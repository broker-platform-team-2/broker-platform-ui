import React, { useCallback, useEffect, useRef, useState } from 'react';
import { D, FONT_HEAD, FONT_BODY } from '../theme/tokens';
import { AppShell } from '../components/shell/AppShell';
import { Card } from '../components/shared/dark-ui';
import { getBotStatus, subscribeBot, startBot, stopBot, setBotTradingAccount } from '../api/bot';
import { useAccount } from '../context/AccountContext';
import { fromUSD, getRate } from '../data/exchangeRates';
import BotDashboardPanel from '../components/bot/BotDashboardPanel';

const SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ', RON: 'lei ' };
const MONTHLY_FEE_USD = 49.99;

const FEATURES = [
  { icon: '⚡', title: 'Momentum Strategy', desc: 'Scans all tickers every tick, scores top-5 by ATR-adjusted momentum and volume surge, then sizes positions by conviction.' },
  { icon: '🛡', title: 'Risk Gate', desc: 'Drawdown kill-switch halts trading if equity drops 8% from peak. Per-position hard stops at −5%, trailing stops at 3% from peak.' },
  { icon: '📡', title: 'Event Reactor', desc: 'Reacts to BULL_RUN, BEAR_CRASH, SECTOR_BOOM, SLUMP and SHOCK events in real time — aggressive buys on rallies, swift exits on crashes.' },
  { icon: '🔁', title: 'Pyramiding', desc: 'Adds to winning positions that stay in the top-N and are up ≥2% from cost, compounding gains on strong momentum runs.' },
  { icon: '📊', title: 'Live Dashboard', desc: 'Streamlit dashboard shows equity curve, open positions with unrealised P&L, last 20 fills, and top-10 tickers by price.' },
  { icon: '🗂', title: 'Replay & Audit', desc: 'Every WebSocket message and order outcome is recorded to JSONL for deterministic post-mortem replay and audit.' },
];

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysLeft(iso) {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso) - new Date()) / 86400000));
}

export default function BotPage() {
  const { accounts, activeId, setActiveId, activeAccount } = useAccount();
  const [status, setStatus]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  // Trading account — the account the bot places orders into.
  // Stored locally and synced to backend when changed.
  const TRADING_ACCT_KEY = 'wakibi.botTradingAccountId';
  const [tradingAccountId, setTradingAccountIdState] = useState(
    () => localStorage.getItem(TRADING_ACCT_KEY)
  );
  const [tradingPickerOpen, setTradingPickerOpen] = useState(false);
  const [tradingSettingMsg, setTradingSettingMsg] = useState('');
  const tradingPickerRef = useRef(null);

  async function handleSetTradingAccount(id) {
    setTradingPickerOpen(false);
    const prev = tradingAccountId;
    localStorage.setItem(TRADING_ACCT_KEY, String(id));
    setTradingAccountIdState(String(id));
    setTradingSettingMsg('');
    try {
      await setBotTradingAccount(id);
      setTradingSettingMsg('saved');
    } catch {
      // Backend endpoint may not exist yet — silently keep local preference
      setTradingSettingMsg('saved-local');
    }
    setTimeout(() => setTradingSettingMsg(''), 2500);
  }

  useEffect(() => {
    // Default trading account to active account if none set yet
    if (!tradingAccountId && activeId) {
      localStorage.setItem(TRADING_ACCT_KEY, String(activeId));
      setTradingAccountIdState(String(activeId));
    }
  }, [activeId, tradingAccountId]);

  useEffect(() => {
    const handler = e => {
      if (tradingPickerRef.current && !tradingPickerRef.current.contains(e.target))
        setTradingPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchStatus = useCallback(() => {
    getBotStatus()
      .then(s => setStatus(s))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  useEffect(() => {
    const handler = e => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const activeCurrency = activeAccount?.currency || 'USD';
  const activeSym      = SYMBOLS[activeCurrency] || `${activeCurrency} `;
  const availBalance   = Number(activeAccount?.balance || 0);
  const needsConversion = activeCurrency !== 'USD';
  const fxRate         = getRate(activeCurrency);
  const feeInCurrency  = needsConversion ? fromUSD(MONTHLY_FEE_USD, activeCurrency) : MONTHLY_FEE_USD;
  const canAfford      = availBalance >= feeInCurrency;

  const isActive  = status?.active === true;
  const isRunning = status?.running === true;
  const subUntil  = status?.subscribedUntil || '';

  async function handleToggle() {
    setSubmitting(true); setError('');
    try {
      const result = isRunning ? await stopBot() : await startBot();
      setStatus(result);
    } catch (e) {
      setError(e?.response?.data?.error || 'Could not update bot state.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubscribe() {
    setSubmitting(true); setError(''); setConfirmed(false);
    try {
      await subscribeBot(activeCurrency);
      setConfirmed(true);
      fetchStatus();
    } catch (e) {
      setError(e?.response?.data?.error || e?.response?.data?.message || 'Subscription failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell title="Trading Bot" subtitle="Autonomous momentum trader — powered by AI strategy">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <Card padding={0} style={{ marginBottom: 18, overflow: 'hidden' }}>
        <div style={{
          padding: '32px 36px',
          background: `linear-gradient(135deg, ${D.surface2} 0%, rgba(89,191,138,0.08) 100%)`,
          borderBottom: `1px solid ${D.hairline}`,
          display: 'flex', alignItems: 'center', gap: 28,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 20, flexShrink: 0,
            background: `linear-gradient(135deg, ${D.sage} 0%, ${D.teal} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32,
          }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 26, color: D.ink, letterSpacing: '-0.02em', marginBottom: 6 }}>
              Wakibi Trading Bot
            </div>
            <div style={{ fontSize: 14, color: D.ink70, lineHeight: 1.6, maxWidth: 560 }}>
              A fully autonomous, aggressive momentum bot that trades stocks 24/7.
              It scans every price tick, scores opportunities using ATR-adjusted momentum,
              and executes through the bot-gateway with a built-in risk gate and event reactor.
            </div>
          </div>
          {isActive && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
              <div style={{
                padding: '10px 18px', borderRadius: 10, textAlign: 'center',
                background: isRunning ? D.sageBg : D.surface3,
                border: `1px solid ${isRunning ? D.sage + '44' : D.hairline2}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: isRunning ? D.sage : D.ink30,
                  }}/>
                  <div style={{ fontSize: 11, color: isRunning ? D.sage : D.ink50, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {isRunning ? 'Trading' : 'Paused'}
                  </div>
                </div>
                <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 15, color: D.ink }}>{daysLeft(subUntil)}d left</div>
                <div style={{ fontSize: 11, color: D.ink50, marginTop: 2 }}>until {fmtDate(subUntil)}</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 18, alignItems: 'start' }}>

        {/* ── Left: features ───────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card padding={22}>
            <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 16, color: D.ink, marginBottom: 16, letterSpacing: '-0.01em' }}>
              What's included
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{
                  padding: '16px 18px', borderRadius: 12,
                  background: D.surface2, border: `1px solid ${D.hairline}`,
                }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{f.icon}</div>
                  <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 13, color: D.ink, marginBottom: 5 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: D.ink50, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Stats strip */}
          <Card padding={20}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
              {[
                { label: 'Strategy', value: 'Momentum' },
                { label: 'Max drawdown', value: '8%' },
                { label: 'Hard stop', value: '−5%' },
                { label: 'Trailing stop', value: '3%' },
              ].map((s, i) => (
                <div key={s.label} style={{
                  textAlign: 'center', padding: '4px 0',
                  borderRight: i < 3 ? `1px solid ${D.hairline}` : 'none',
                }}>
                  <div style={{ fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 17, color: D.sage, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Right: payment card ───────────────────────────────── */}
        <Card padding={0} style={{ position: 'sticky', top: 0 }}>

          {/* Price header */}
          <div style={{ padding: '24px 24px 18px', borderBottom: `1px solid ${D.hairline}` }}>
            <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600, marginBottom: 8 }}>Monthly subscription</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 36, color: D.ink, letterSpacing: '-0.03em' }}>$49.99</span>
              <span style={{ fontSize: 13, color: D.ink50 }}> / month</span>
            </div>
            {needsConversion && (
              <div style={{ fontSize: 12, color: D.ink50, marginTop: 4 }}>
                ≈ {activeSym}{feeInCurrency.toFixed(2)} {activeCurrency} · 1 USD = {fxRate.toFixed(4)} {activeCurrency}
              </div>
            )}
          </div>

          <div style={{ padding: '18px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Account picker */}
            <div>
              <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 8 }}>Pay from</div>
              <div ref={pickerRef} style={{ position: 'relative' }}>
                <button onClick={() => setPickerOpen(o => !o)} style={{
                  width: '100%', textAlign: 'left', cursor: 'pointer',
                  background: D.surface2, border: `1px solid ${pickerOpen ? D.sage : D.hairline}`,
                  borderRadius: pickerOpen ? '9px 9px 0 0' : 9, padding: '10px 12px',
                  display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY,
                }}>
                  <div style={{ background: D.sageBg, borderRadius: 6, padding: '3px 8px', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12, color: D.sage }}>{activeCurrency}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: D.ink, fontVariantNumeric: 'tabular-nums' }}>
                      {activeSym}{availBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 11, color: D.ink50, marginTop: 1 }}>Available</div>
                  </div>
                  <span style={{ color: D.ink50, fontSize: 11, transform: pickerOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                </button>
                {pickerOpen && (
                  <div style={{
                    position: 'absolute', left: 0, right: 0, zIndex: 50,
                    background: D.surface2, border: `1px solid ${D.sage}`,
                    borderTop: 'none', borderRadius: '0 0 9px 9px', overflow: 'hidden',
                  }}>
                    {accounts.map((a, i) => {
                      const isSel = String(a.accountId) === String(activeId);
                      const sym = SYMBOLS[a.currency] || `${a.currency} `;
                      return (
                        <button key={a.accountId} onClick={() => { setActiveId(a.accountId); setPickerOpen(false); }} style={{
                          width: '100%', textAlign: 'left', cursor: 'pointer',
                          background: isSel ? D.sageBg : 'transparent',
                          border: 'none', borderBottom: i < accounts.length - 1 ? `1px solid ${D.hairline}` : 'none',
                          padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY,
                        }}>
                          <div style={{ background: isSel ? D.sageBg : D.surface3, borderRadius: 6, padding: '3px 8px', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12, color: isSel ? D.sage : D.ink50 }}>{a.currency}</div>
                          <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: D.ink, fontVariantNumeric: 'tabular-nums' }}>
                            {sym}{Number(a.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {isSel && <span style={{ color: D.sage }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div style={{ background: D.surface2, borderRadius: 10, padding: '12px 14px', border: `1px solid ${D.hairline}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: D.ink70 }}>Subscription fee</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: D.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {needsConversion ? `${activeSym}${feeInCurrency.toFixed(2)}` : `$${MONTHLY_FEE_USD.toFixed(2)}`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12.5, color: D.ink70 }}>Period</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: D.ink }}>30 days</span>
              </div>
              {isActive && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12.5, color: D.ink70 }}>Extends until</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: D.sage }}>
                    {fmtDate(new Date(new Date(subUntil || new Date()).getTime() + 30 * 86400000).toISOString())}
                  </span>
                </div>
              )}
              <div style={{ height: 1, background: D.hairline, margin: '8px 0' }}/>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12.5, color: D.ink, fontWeight: 600 }}>Total due</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: D.ink, fontVariantNumeric: 'tabular-nums' }}>
                  {needsConversion ? `${activeSym}${feeInCurrency.toFixed(2)} ${activeCurrency}` : `$${MONTHLY_FEE_USD.toFixed(2)}`}
                </span>
              </div>
            </div>

            {/* Warnings / confirmations */}
            {!canAfford && (
              <div style={{ background: D.sellBg, color: D.sell, padding: '10px 12px', borderRadius: 9, fontSize: 12, border: `1px solid ${D.sell}33` }}>
                ⚠ Insufficient funds. Need {activeSym}{feeInCurrency.toFixed(2)} {activeCurrency}.
              </div>
            )}
            {error && (
              <div style={{ background: D.sellBg, color: D.sell, padding: '10px 12px', borderRadius: 9, fontSize: 12, border: `1px solid ${D.sell}33` }}>
                ⚠ {error}
              </div>
            )}
            {confirmed && (
              <div style={{ background: D.sageBg, color: D.sage, padding: '10px 12px', borderRadius: 9, fontSize: 12, border: `1px solid ${D.sage}33` }}>
                ✓ Bot activated — expires {fmtDate(status?.subscribedUntil)}
              </div>
            )}

            {/* Start / Stop button — only shown when subscribed */}
            {isActive && (
              <button
                disabled={submitting}
                onClick={handleToggle}
                style={{
                  width: '100%', padding: '14px',
                  background: isRunning ? D.sellBg : D.sageBg,
                  border: `1px solid ${isRunning ? D.sell + '66' : D.sage + '66'}`,
                  color: isRunning ? D.sell : D.sage,
                  borderRadius: 11, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? '…' : isRunning ? '⏹ Stop bot' : '▶ Start bot'}
              </button>
            )}

            {/* Subscribe button */}
            <button
              disabled={!canAfford || submitting || loading}
              onClick={handleSubscribe}
              style={{
                width: '100%', padding: '14px',
                background: (!canAfford || submitting || loading) ? D.surface3 : D.sage,
                border: 'none',
                color: (!canAfford || submitting || loading) ? D.ink50 : D.plumDeep,
                borderRadius: 11, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 14,
                cursor: (canAfford && !submitting && !loading) ? 'pointer' : 'not-allowed',
              }}
            >
              {submitting ? 'Processing…' : isActive ? 'Extend subscription (+30 days)' : 'Activate bot — $49.99/mo'}
            </button>

            <div style={{ fontSize: 11, color: D.ink50, textAlign: 'center', lineHeight: 1.5 }}>
              The bot trades on your behalf using your existing account balance. Past performance does not guarantee future results.
            </div>
          </div>

          {/* ── Trading account selector ─────────────────────────── */}
          {isActive && accounts.length > 0 && (
            <div style={{ borderTop: `1px solid ${D.hairline}`, padding: '18px 24px 22px' }}>
              <div style={{ fontSize: 11, color: D.ink50, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600, marginBottom: 4 }}>
                Profit account
              </div>
              <div style={{ fontSize: 11, color: D.ink50, marginBottom: 10, lineHeight: 1.5 }}>
                Bot profits are deposited into this account.
              </div>
              <div ref={tradingPickerRef} style={{ position: 'relative' }}>
                {(() => {
                  const tradingAcct = accounts.find(a => String(a.accountId) === String(tradingAccountId)) || accounts[0];
                  const tSym = SYMBOLS[tradingAcct?.currency] || `${tradingAcct?.currency} `;
                  return (
                    <>
                      <button onClick={() => setTradingPickerOpen(o => !o)} style={{
                        width: '100%', textAlign: 'left', cursor: 'pointer',
                        background: D.surface2, border: `1px solid ${tradingPickerOpen ? D.teal : D.hairline}`,
                        borderRadius: tradingPickerOpen ? '9px 9px 0 0' : 9, padding: '10px 12px',
                        display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY,
                      }}>
                        <div style={{ background: 'rgba(46,158,150,0.14)', borderRadius: 6, padding: '3px 8px', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12, color: D.teal }}>
                          {tradingAcct?.currency || '—'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: D.ink, fontVariantNumeric: 'tabular-nums' }}>
                            {tSym}{Number(tradingAcct?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div style={{ fontSize: 11, color: D.ink50, marginTop: 1 }}>Selected trading account</div>
                        </div>
                        <span style={{ color: D.ink50, fontSize: 11, transform: tradingPickerOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
                      </button>
                      {tradingPickerOpen && (
                        <div style={{
                          position: 'absolute', left: 0, right: 0, zIndex: 50,
                          background: D.surface2, border: `1px solid ${D.teal}`,
                          borderTop: 'none', borderRadius: '0 0 9px 9px', overflow: 'hidden',
                        }}>
                          {accounts.map((a, i) => {
                            const isSel = String(a.accountId) === String(tradingAccountId);
                            const sym = SYMBOLS[a.currency] || `${a.currency} `;
                            return (
                              <button key={a.accountId} onClick={() => handleSetTradingAccount(a.accountId)} style={{
                                width: '100%', textAlign: 'left', cursor: 'pointer',
                                background: isSel ? 'rgba(46,158,150,0.14)' : 'transparent',
                                border: 'none', borderBottom: i < accounts.length - 1 ? `1px solid ${D.hairline}` : 'none',
                                padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT_BODY,
                              }}>
                                <div style={{ background: isSel ? 'rgba(46,158,150,0.14)' : D.surface3, borderRadius: 6, padding: '3px 8px', fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 12, color: isSel ? D.teal : D.ink50 }}>{a.currency}</div>
                                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: D.ink, fontVariantNumeric: 'tabular-nums' }}>
                                  {sym}{Number(a.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                {isSel && <span style={{ color: D.teal }}>✓</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              {tradingSettingMsg && (
                <div style={{ marginTop: 8, fontSize: 11, color: D.teal }}>
                  ✓ {tradingSettingMsg === 'saved' ? 'Trading account updated.' : 'Preference saved locally.'}
                </div>
              )}
            </div>
          )}

        </Card>

      </div>

      {/* ── Live dashboard — full width below the grid ────────────────────── */}
      {isActive && (
        <BotDashboardPanel isRunning={isRunning} />
      )}

    </AppShell>
  );
}