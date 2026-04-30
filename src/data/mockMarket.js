// Mock market data — used until exchange-client-service is live and an
// /market endpoint is exposed through the gateway.
export const SECTORS = ['Tech', 'Finance', 'Energy', 'Healthcare', 'Retail', 'Industrial'];

export const STOCKS = [
  { ticker: 'ARKA', name: 'Arkadia Technologies',    sector: 'Tech',       price: 131.42, change: +1.35, changePct: +1.04, volume: 142_300, mcap: '24.8B', volatility: 0.034 },
  { ticker: 'MNVS', name: 'Mnemos Holdings',         sector: 'Finance',    price: 88.15,  change: -0.62, changePct: -0.70, volume: 98_120,  mcap: '12.1B', volatility: 0.022 },
  { ticker: 'HELO', name: 'Helios Energy',           sector: 'Energy',     price: 47.98,  change: +0.84, changePct: +1.78, volume: 220_410, mcap: '8.4B',  volatility: 0.041 },
  { ticker: 'VERA', name: 'Veracruz Pharma',         sector: 'Healthcare', price: 212.05, change: +4.20, changePct: +2.02, volume: 64_900,  mcap: '31.2B', volatility: 0.029 },
  { ticker: 'KORU', name: 'Koru Retail Group',       sector: 'Retail',     price: 19.42,  change: -0.31, changePct: -1.57, volume: 311_800, mcap: '2.9B',  volatility: 0.038 },
  { ticker: 'NIVA', name: 'Niva Industrial Works',   sector: 'Industrial', price: 76.30,  change: +0.05, changePct: +0.07, volume: 56_410,  mcap: '6.1B',  volatility: 0.018 },
  { ticker: 'AMARA',name: 'Amara Solar',             sector: 'Energy',     price: 34.71,  change: +1.12, changePct: +3.33, volume: 184_220, mcap: '4.0B',  volatility: 0.046 },
  { ticker: 'LOOM', name: 'Loom Textiles',           sector: 'Retail',     price: 9.18,   change: -0.07, changePct: -0.76, volume: 401_330, mcap: '910M',  volatility: 0.033 },
  { ticker: 'ZEDA', name: 'Zeda Cloud',              sector: 'Tech',       price: 188.72, change: +6.85, changePct: +3.77, volume: 122_810, mcap: '28.1B', volatility: 0.052 },
];

export function findStock(ticker) {
  return STOCKS.find(s => s.ticker === ticker);
}
