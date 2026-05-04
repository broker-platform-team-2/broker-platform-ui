// Mock orders — used until trade-service exposes a list endpoint.
// (trade-service has POST/GET-by-id/DELETE /orders today, but no GET / list.)
import { D } from '../theme/tokens';

export const ORDERS = [
  { id: 'ord-3501', ticker: 'ARKA',  side: 'BUY',  type: 'LIMIT',  qty: 20,   filled: 0,   price: 128.50, status: 'PENDING',   tif: 'GTC', placedAt: '2026-05-04T10:21:00' },
  { id: 'ord-3500', ticker: 'AMARA', side: 'BUY',  type: 'LIMIT',  qty: 200,  filled: 80,  price: 33.40,  status: 'PARTIAL',   tif: 'DAY', placedAt: '2026-05-04T09:48:00' },
  { id: 'ord-3499', ticker: 'KORU',  side: 'SELL', type: 'LIMIT',  qty: 500,  filled: 0,   price: 21.00,  status: 'PENDING',   tif: 'GTC', placedAt: '2026-05-03T15:10:00' },
  { id: 'ord-3498', ticker: 'HELO',  side: 'BUY',  type: 'MARKET', qty: 100,  filled: 100, price: 47.95,  status: 'FILLED',    tif: 'IOC', placedAt: '2026-05-03T11:32:00' },
  { id: 'ord-3492', ticker: 'ZEDA',  side: 'BUY',  type: 'LIMIT',  qty: 12,   filled: 12,  price: 175.20, status: 'FILLED',    tif: 'GTC', placedAt: '2026-04-28T14:32:00' },
  { id: 'ord-3491', ticker: 'KORU',  side: 'SELL', type: 'LIMIT',  qty: 200,  filled: 200, price: 19.85,  status: 'FILLED',    tif: 'DAY', placedAt: '2026-04-28T11:08:00' },
  { id: 'ord-3488', ticker: 'AMARA', side: 'BUY',  type: 'LIMIT',  qty: 200,  filled: 140, price: 31.10,  status: 'PARTIAL',   tif: 'GTC', placedAt: '2026-04-27T15:55:00' },
  { id: 'ord-3485', ticker: 'HELO',  side: 'BUY',  type: 'MARKET', qty: 50,   filled: 50,  price: 47.20,  status: 'FILLED',    tif: 'IOC', placedAt: '2026-04-26T10:12:00' },
  { id: 'ord-3480', ticker: 'LOOM',  side: 'SELL', type: 'LIMIT',  qty: 1000, filled: 0,   price: 9.50,   status: 'CANCELLED', tif: 'GTC', placedAt: '2026-04-25T09:42:00' },
  { id: 'ord-3477', ticker: 'VERA',  side: 'BUY',  type: 'LIMIT',  qty: 8,    filled: 8,   price: 198.50, status: 'FILLED',    tif: 'GTC', placedAt: '2026-04-24T13:18:00' },
  { id: 'ord-3470', ticker: 'NIVA',  side: 'BUY',  type: 'LIMIT',  qty: 60,   filled: 0,   price: 70.00,  status: 'REJECTED',  tif: 'GTC', placedAt: '2026-04-22T16:18:00' },
];

export const STATUS_TONE = {
  PENDING:   { color: D.warn, bg: D.warnBg, label: 'Pending'   },
  PARTIAL:   { color: D.warn, bg: D.warnBg, label: 'Partial'   },
  FILLED:    { color: D.sage, bg: D.sageBg, label: 'Filled'    },
  CANCELLED: { color: D.ink50, bg: 'rgba(255,255,255,0.06)', label: 'Cancelled' },
  REJECTED:  { color: D.sell, bg: D.sellBg, label: 'Rejected'  },
};
