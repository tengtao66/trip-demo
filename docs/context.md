# TERRA Trip Demo — Project Context

## Overview
Tour package booking demo showcasing 3 PayPal payment flows with a merchant dashboard.

## Tech Stack
- **Frontend:** React 19, Vite 8, Tailwind CSS v4, shadcn/ui (New York), Zustand, React Router v7, Recharts, Lucide React
- **Backend:** Express v5, TypeScript, better-sqlite3, @paypal/paypal-server-sdk v2
- **PayPal:** JS SDK v5 via @paypal/react-paypal-js v8.x (NOT v6/v9+)
- **Auth:** Mock auth with pre-seeded customer/merchant, role switching via X-User-Role header

## Three Payment Flows

| Flow | Trip | PayPal Feature | Status |
|------|------|---------------|--------|
| Flow 1 | Tokyo Cherry Blossom ($800) | Authorize & Capture (partial capture deposit $200, balance $600) | Implemented |
| Flow 2 | Bali Adventure ($2,500) | Vault (UNSCHEDULED_POSTPAID) — setup fee + merchant-initiated add-ons + final settlement | Implemented |
| Flow 3 | Custom European Tour (variable) | Invoice API v2 — auto-create + send + QR code | Implemented |

## Design
- **Brand:** TERRA — Guided Tours
- **Style:** Modern earth tones (Mocha #5C3D2E, Terracotta #A0522D, Sage #86A873, Alpine Oat #FAF6F1)
- **Font:** Inter (Google Fonts)
- **Color convention:** Use unprefixed shadcn classes (bg-primary, text-accent, etc.)
- **Images:** Real trip photos with gradient fades (tokyo.webp, bali2.webp, euro2.jpg, guided-tour-16.webp)

## Key Files
- `server/src/services/paypal.ts` — PayPal SDK client + getPayPalAccessToken() + PAYPAL_BASE_URL
- `server/src/routes/orders.ts` — Create/authorize/capture orders (Flow 1 + 2)
- `server/src/routes/vault.ts` — Vault charge/delete (Flow 2), sim_ prefix bypass
- `server/src/routes/invoices.ts` — Create/send/poll invoices (Flow 3)
- `server/src/routes/trip-requests.ts` — Trip request + auto-invoice creation
- `client/src/pages/CheckoutPage.tsx` — Dispatcher by payment_flow
- `client/src/pages/checkout/` — CheckoutAuthorizePage, CheckoutVaultPage, CustomTripRequestPage

## Important Patterns
- Server-side price calculation (never trust client amounts)
- Booking reference: TERRA-XXXX format
- Booking lookup accepts both UUID and TERRA-XXXX reference
- Vault flows use direct REST (not SDK) for payment_source.paypal.attributes.vault
- Simulation uses `sim_` prefix on vault tokens to bypass PayPal calls
- Invoice API returns `{ rel, href }` — extract ID from href
