# broker-platform-ui

React 19 frontend for the Lynx broker platform (branded **Wakibi Trade**). Provides a dark-themed trading interface with real-time price feeds, order management, multi-currency accounts, options trading, and an automated trading bot subscription.

## Tech Stack

- **React 19** + React Router DOM 7
- **Axios** — REST API client with JWT interceptors
- **WebSocket** (native browser) — live price updates and order notifications
- **Create React App** (react-scripts 5)

## Prerequisites

- Node.js 16+
- A running instance of `broker-platform-core` (user-gateway on port 8180, notification-service on port 8188)

## Getting Started

```bash
npm install
npm start       # dev server at http://localhost:3000
npm run build   # production build to /build
npm test        # run tests
```

## Environment Variables

Create a `.env` file in the project root:

```env
REACT_APP_API_URL=http://localhost:8180
REACT_APP_WS_URL=ws://localhost:8188/ws
```

| Variable | Description |
|---|---|
| `REACT_APP_API_URL` | Base URL for all REST calls (user-gateway) |
| `REACT_APP_WS_URL` | WebSocket URL for live notifications and price feeds |

## Project Structure

```
src/
├── api/                        # Axios wrappers — one file per backend resource
│   ├── client.js               # Axios instance, Bearer token injection, 401 handling
│   ├── auth.js                 # login, register, forgotPassword, resetPassword, changePassword
│   ├── accounts.js             # getMyAccounts, deposit, deduct, createAccount, getFundHistory
│   ├── holdings.js             # getMyHoldings
│   ├── orders.js               # placeOrder, cancelOrder, cancelOrderByTransactionId
│   ├── transactions.js         # getMyTransactions
│   ├── market.js               # getStocks, getOrderBook, getStockHistory, getMarketStatus
│   ├── options.js              # getOptions
│   └── bot.js                  # getBotStatus, subscribeBot, startBot, stopBot
├── context/
│   ├── AuthContext.jsx         # user state, login/register/logout, token in localStorage
│   ├── AccountContext.jsx      # multi-account selection, persists active account
│   └── NotificationsContext.js # single WebSocket connection, price feed, toast queue
├── hooks/
│   └── useNotifications.js     # subscribe to WebSocket messages without opening a new connection
├── pages/
│   ├── LandingPage.jsx         # public marketing page
│   ├── AuthPage.jsx            # login / signup / forgot-password (all in one)
│   ├── HomePage.jsx            # portfolio dashboard
│   ├── StocksPage.jsx          # market browser + order book
│   ├── TradePage.jsx           # order ticket (stocks)
│   ├── OrdersPage.jsx          # order history + cancellation
│   ├── OptionsPage.jsx         # options chain + order ticket
│   ├── WalletPage.jsx          # multi-currency accounts, deposit/withdraw, cashflow
│   ├── BotPage.jsx             # trading bot subscription + start/stop
│   └── ProfilePage.jsx         # username, email, change password
├── components/
│   ├── shell/AppShell.jsx      # sidebar, topbar, notifications bell, toast stack
│   ├── auth/                   # BrandPanel, form inputs, password strength meter
│   └── shared/
│       ├── dark-ui.jsx         # Card, Pill, Money, Delta, AreaChart, Sparkline, KPI, …
│       └── WakibiMark.jsx      # logo SVG
├── data/                       # FX rate lookup table, mock fixtures
├── theme/tokens.js             # design tokens (colors, fonts) for dark and light themes
├── App.js                      # route definitions + ProtectedLayout + PublicOnlyRoute guards
└── index.js                    # React root, provider tree
```

## Routing

| Path | Page | Auth required |
|---|---|---|
| `/` | LandingPage | No (redirects to `/home` if signed in) |
| `/login` | AuthPage — login | No |
| `/signup` | AuthPage — signup | No |
| `/forgot` | AuthPage — password recovery | No |
| `/home` | HomePage | Yes |
| `/markets` | StocksPage | Yes |
| `/trade` | TradePage | Yes |
| `/orders` | OrdersPage | Yes |
| `/wallet` | WalletPage | Yes |
| `/options` | OptionsPage | Yes |
| `/bot` | BotPage | Yes |
| `/profile` | ProfilePage | Yes |

`ProtectedLayout` redirects unauthenticated users to `/login`. `PublicOnlyRoute` redirects authenticated users to `/home`. All protected routes are wrapped in `NotificationsProvider`, which establishes the shared WebSocket connection.

## Authentication

JWT token is stored in `localStorage` under the key `wakibi.token`. The Axios client injects it on every request. On a 401 response the client dispatches a `wakibi:auth-expired` event, which `AuthContext` listens to — it clears the token and forces a redirect to `/login` without a full page reload.

## Real-Time Data

A single WebSocket connection is shared across all pages via `NotificationsContext`. Components subscribe through `useNotificationMessage(callback)` rather than opening their own connections.

**Message types**:

| Type | Payload | Consumer |
|---|---|---|
| `PRICE_UPDATE` | ticker, price, change, change_pct, volume | HomePage, StocksPage, TradePage — live price overlays |
| `ORDER_UPDATE` | order_id, status | OrdersPage, HomePage — triggers a portfolio refresh |
| `MARKET_EVENT` | event type, details | Sidebar market status indicator, toast queue |

Price updates are throttled: incoming ticks are stored in a ref and flushed to React state at most every 250 ms.

## Key Features

- **Portfolio dashboard** — holdings table with P&L, sparklines, area chart, recent transactions
- **Market browser** — stock search, order book depth, price history chart with ML forecast overlay
- **Order ticket** — market / limit orders, time-in-force (GTC / DAY / IOC), real-time cost summary with FX conversion
- **Options trading** — calls/puts chain, Greeks display, PUT validation (must hold underlying)
- **Multi-currency wallets** — one account per currency, deposit/withdraw modals, cashflow chart
- **Trading bot** — $49.99/mo subscription, start/stop control, strategy/risk stats
- **Live notifications** — toast stack (auto-dismiss 6 s, max 5 visible) + persistent bell dropdown

## Design System

All reusable primitives live in `src/components/shared/dark-ui.jsx`. The dark theme uses deep purple backgrounds (`#1A0E16`) with sage green (`#59BF8A`) for gains/CTAs and coral red (`#FF6B6B`) for losses/sells. Fonts: **Funnel Display** (headings) and **Funnel Sans** (body). The auth pages use a separate light-theme token set.

## Related Repositories

| Repo | Description |
|---|---|
| `broker-platform-core` | Java/Spring Boot microservices backend |
| `broker-platform-bot-gateway-spec` | Python algorithmic trading bot |
