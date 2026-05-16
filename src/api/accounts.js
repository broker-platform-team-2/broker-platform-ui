import { api } from './client';

/**
 * GET /accounts/me — list of all accounts the user owns, primary first.
 * Each item: { accountId, userId, balance, frozenBalance, currency }
 */
export async function getMyAccounts() {
  const { data } = await api.get('/accounts/me');
  return Array.isArray(data) ? data : [];
}

/**
 * Backward-compat helper for pages that still expect a single "primary" account.
 * Picks the USD account if present, otherwise the first one. Use getMyAccounts()
 * for anything that needs to display multiple currencies.
 */
export async function getMyAccount() {
  const accounts = await getMyAccounts();
  if (accounts.length === 0) return null;
  return accounts.find(a => a.currency === 'USD') || accounts[0];
}

/**
 * Backward-compat: returns { available, frozen, total, currency } for the USD
 * account (or first one). Pages that need multi-currency should call getMyAccounts()
 * directly and not this.
 */
export async function getBalance() {
  const acc = await getMyAccount();
  if (!acc) return null;
  const available = Number(acc.balance) || 0;
  const frozen = Number(acc.frozenBalance) || 0;
  return { available, frozen, total: available + frozen, currency: acc.currency };
}

/** Deposit into a specific currency account. */
export async function deposit(currency, amount) {
  const { data } = await api.post('/funds/deposit', { currency, amount });
  return data;
}


/** Deduct from a specific currency account. */
export async function deduct(currency, amount) {
  const { data } = await api.post('/funds/withdraw', { currency, amount });
  return data;
}

/**
 * GET /funds/history?currency=EUR
 * Returns list of { operationId, operationType, amount, currency, date } newest first.
 * operationType is "DEPOSIT" or "WITHDRAW".
 */
export async function getFundHistory(currency) {
  const { data } = await api.get('/funds/history', { params: { currency } });
  return Array.isArray(data) ? data : [];
}

/** Creates an account */
export async function createAccount(currency) {
  const { data } = await api.post('/accounts', { currency }, {
    // headers: {
    //   'X-User-Id': userId // This puts the ID in the HTTP headers
    // }
  });
  return data;
}
