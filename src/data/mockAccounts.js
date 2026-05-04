// Mock multi-currency accounts — used for Wallet and Orders display.
// The backend currently models one account per user; once multi-currency
// lands, replace this with a real /accounts list call.
export const ACCOUNTS = [
  { id: 'acc_eur', currency: 'EUR', balance: 18420.55, frozen: 1240.00 },
  { id: 'acc_ron', currency: 'RON', balance: 8950.00,  frozen: 0 },
];
