// Exchange rates relative to USD (1 USD = X units of currency).
export const USD_RATES = {
  USD: 1.0,
  EUR: 0.9259,
  GBP: 0.7963,
  CHF: 0.8981,
  JPY: 148.61,
  CAD: 1.3611,
  AUD: 1.5185,
  NZD: 1.6574,
  SEK: 10.463,
  NOK: 10.648,
  DKK: 6.907,
  HKD: 7.815,
  SGD: 1.352,
  CNY: 7.269,
  INR: 83.52,
  KRW: 1347.22,
  BRL: 5.019,
  MXN: 17.176,
  ZAR: 18.843,
  TRY: 32.593,
  PLN: 3.954,
  RON: 4.602,
};

/** Convert an amount from USD into `toCurrency`. */
export function fromUSD(amount, toCurrency) {
  const rate = USD_RATES[toCurrency] ?? 1;
  return amount * rate;
}

/** Convert an amount from `fromCurrency` into USD. */
export function toUSD(amount, fromCurrency) {
  const rate = USD_RATES[fromCurrency] ?? 1;
  return amount / rate;
}

/** Exchange rate: how many units of `toCurrency` per 1 USD. */
export function getRate(toCurrency) {
  return USD_RATES[toCurrency] ?? 1;
}