# TERRA Trip Demo — Implementation Plan Outline

> This is the skeleton outline. Each section will be expanded by a sub-agent into full task definitions with exact file paths, code, tests, and commands.

**Goal:** Build a tour booking demo showcasing three PayPal payment flows (authorize/capture, vaulting, invoice) with a merchant dashboard.

**Architecture:** Monorepo with React 19 frontend + Express v5 backend. PayPal JS SDK v5 via react-paypal-js v8.x. SQLite for persistence. Mock auth with role switching.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, shadcn/ui, Zustand, React Router v7, Express v5, TypeScript, better-sqlite3, @paypal/react-paypal-js v8.x, @paypal/paypal-server-sdk, Recharts, Lucide React

**Spec:** `docs/superpowers/specs/2026-04-02-trip-demo-design.md`

---

## Section 1: Project Scaffolding & Infrastructure

Sets up the monorepo, installs dependencies, configures Vite/Tailwind/Express, creates SQLite schema, seeds data, and establishes the dev workflow.

**Key tasks:**
- Initialize npm workspaces monorepo (client/ + server/)
- Install all dependencies for both workspaces
- Configure Vite with proxy, Tailwind v4, shadcn/ui
- Set up Express v5 with TypeScript, SQLite connection
- Create database schema (users, trips, bookings, booking_charges, trip_requests)
- Seed pre-built users (customer + merchant) and 3 trip records
- Create .env template with PayPal sandbox credentials
- Verify `npm run dev` starts both client and server

---

## Section 2: Auth & Layout Shell

Implements mock authentication, role switching, route protection, and the shared layout (nav, footer, role switcher) with earth-tone design tokens.

**Key tasks:**
- Set up Tailwind v4 theme with earth-tone color tokens
- Create Zustand auth store (user, role, login/logout/switchRole)
- Build Login page with two clickable user cards
- Build shared Layout component (Header with nav + role badge + role switcher, Footer)
- Set up React Router v7 with route protection (customer vs merchant)
- Create mock auth middleware on server (reads X-User-Role header)
- Create authFetch helper on client

---

## Section 3: Trip Listing & Detail Pages

Builds the customer-facing trip browsing experience — landing page with trip cards and individual trip detail pages with itinerary and pricing.

**Key tasks:**
- Create trip data constants (or fetch from server seed data)
- Build TripCard component with image gradient, badge, pricing
- Build Home page with hero section + trip card grid
- Build TripDetail page with hero, itinerary timeline, pricing sidebar, Book Now CTA
- Set up server routes: GET /api/trips, GET /api/trips/:slug
- Wire up navigation between listing → detail → checkout

---

## Section 4: Flow 1 — Authorize & Capture (Tokyo Cherry Blossom)

Implements the full authorize & capture payment flow with PayPalScriptProvider, partial capture, and merchant capture action.

**Key tasks:**
- Set up PayPalScriptProvider with intent="authorize" on checkout page
- Build Checkout page for Flow 1 with pricing breakdown
- Server: POST /api/orders/create (intent=AUTHORIZE)
- Server: POST /api/orders/:orderId/authorize → immediate partial capture of deposit
- Server: POST /api/payments/authorizations/:authId/capture (balance capture)
- Server: POST /api/payments/authorizations/:authId/void
- Client: onApprove flow → confirmation page
- Create Bookings list page and Booking detail page (customer view)

---

## Section 5: Flow 2 — Vaulting (Bali Adventure Retreat)

Implements vault-with-purchase, merchant-initiated subsequent charges, and vault deletion. Includes the booking detail timeline view.

**Key tasks:**
- Set up PayPalScriptProvider with intent="capture", vault=true on checkout page
- Build Checkout page for Flow 2 with setup fee display
- Server: POST /api/orders/create with vault attributes (UNSCHEDULED_POSTPAID)
- Server: POST /api/orders/:orderId/capture → extract vault token
- Server: POST /api/vault/:vaultId/charge (merchant-initiated with vault_id)
- Server: DELETE /api/vault/:vaultId (delete payment token)
- Build merchant Booking Detail page with payment timeline
- Build "Charge Add-on" dialog and "Final Settlement" action

---

## Section 6: Flow 3 — Invoice (Custom European Grand Tour)

Implements the custom trip request form, merchant invoice creation via PayPal Invoicing API v2, and invoice status tracking.

**Key tasks:**
- Build custom trip request form (dates, destinations with prices, activities, email, notes)
- Server: POST /api/trip-requests (save request)
- Build merchant Trip Requests list and detail view
- Server: POST /api/invoices/create (PayPal Invoicing API v2 — create draft)
- Server: POST /api/invoices/:id/send (send invoice)
- Server: GET /api/invoices/:id/status (poll invoice status)
- Build merchant Invoice management page
- Wire up status transitions: REQUEST_SUBMITTED → AWAITING_DEPOSIT → DEPOSIT_RECEIVED → FULLY_PAID

---

## Section 7: Merchant Dashboard

Builds the dashboard overview with KPI cards, charts (Recharts), recent bookings table, and simulation mode.

**Key tasks:**
- Server: GET /api/merchant/stats (aggregate KPIs)
- Server: GET /api/merchant/charts (revenue by flow, bookings trend, monthly revenue)
- Build KPI stat cards (Active Bookings, Pending Captures, Open Invoices, Revenue)
- Build Donut chart (revenue by flow) using Recharts
- Build Line chart (bookings trend 30 days) using Recharts
- Build Bar chart (monthly revenue by charge type) using Recharts
- Build Recent Bookings table with action links
- Build Simulation mode (fast-forward Flow 2 lifecycle)

---

## Section 8: Polish & Integration Testing

Final pass for cross-flow consistency, error handling, and end-to-end testing.

**Key tasks:**
- Add error banners for PayPal API failures
- Add loading states and skeleton screens
- Test all three flows end-to-end in PayPal sandbox
- Verify role switching works correctly across all routes
- Add responsive layout adjustments for smaller screens
- Final cleanup and documentation update
