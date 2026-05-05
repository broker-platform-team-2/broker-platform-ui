import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMyAccounts } from '../api/accounts';
import { useAuth } from './AuthContext';

const AccountContext = createContext(null);
const ACTIVE_KEY = 'wakibi.activeAccountId';

export function AccountProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveIdState] = useState(() => localStorage.getItem(ACTIVE_KEY));

  useEffect(() => {
    if (!isAuthenticated) {
      setAccounts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getMyAccounts()
      .then(list => {
        setAccounts(list);
        setActiveIdState(prev => {
          const exists = list.some(a => String(a.accountId) === String(prev));
          if (exists) return prev;
          const primary = list.find(a => a.currency === 'EUR') || list[0];
          const id = primary ? String(primary.accountId) : null;
          if (id) localStorage.setItem(ACTIVE_KEY, id);
          return id;
        });
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const setActiveId = useCallback((id) => {
    const s = String(id);
    localStorage.setItem(ACTIVE_KEY, s);
    setActiveIdState(s);
  }, []);

  const refreshAccounts = useCallback(async () => {
    const list = await getMyAccounts();
    setAccounts(list);
    return list;
  }, []);

  const activeAccount =
    accounts.find(a => String(a.accountId) === String(activeId)) || accounts[0] || null;

  return (
    <AccountContext.Provider value={{ accounts, setAccounts, activeId, setActiveId, activeAccount, loading, refreshAccounts }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount must be inside AccountProvider');
  return ctx;
}
