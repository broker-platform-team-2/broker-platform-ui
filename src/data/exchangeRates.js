// Mock exchange rates relative to EUR (1 EUR = X units of currency).
// Update these periodically or wire to a live rates API.
export const EUR_RATES = {
  EUR: 1.0,
  USD: 1.08,
  GBP: 0.86,
  CHF: 0.97,
  JPY: 160.5,
  CAD: 1.47,
  AUD: 1.64,
  NZD: 1.79,
  SEK: 11.30,
  NOK: 11.50,
  DKK: 7.46,
  HKD: 8.44,
  SGD: 1.46,
  CNY: 7.85,
  INR: 90.20,
  KRW: 1455.0,
  BRL: 5.42,
  MXN: 18.55,
  ZAR: 20.35,
  TRY: 35.20,
  PLN: 4.27,
  RON: 4.97,
};

/** Convert an amount from EUR into `toCurrency`. */
export function fromEUR(amount, toCurrency) {
  const rate = EUR_RATES[toCurrency] ?? 1;
  return amount * rate;
}

/** Convert an amount from `fromCurrency` into EUR. */
export function toEUR(amount, fromCurrency) {
  const rate = EUR_RATES[fromCurrency] ?? 1;
  return amount / rate;
}

/** Exchange rate: how many units of `toCurrency` per 1 EUR. */
export function getRate(toCurrency) {
  return EUR_RATES[toCurrency] ?? 1;
}
