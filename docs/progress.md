# TERRA Trip Demo — Progress Log

## Session 1 (2026-04-02 ~ 2026-04-03)

### Completed Sections

**Section 1: Project Scaffolding** — Monorepo (client/server), React 19 + Vite + Tailwind v4 + shadcn/ui, Express v5 + SQLite, earth-tone TERRA color tokens, 3 seeded trips.

**Section 2: Auth & Layout** — Zustand auth store with persist, Login page (customer/merchant cards), Layout with mocha header + role switcher, React Router v7 with route protection, mock auth middleware.

**Section 3: Trip Pages** — Trip listing with real photos (tokyo.webp, bali2.webp, euro2.jpg) + gradient fades, trip detail with split hero layout (text left, photo right with mask-image fade), itinerary timeline.

**Section 4: Flow 1 — Authorize & Capture** — PayPal SDK service (`services/paypal.ts`), order creation with intent=AUTHORIZE, authorize + partial capture deposit, balance capture, void, booking reference generator (TERRA-XXXX), customer bookings pages, merchant authorize detail page with countdown timer + two-phase timeline.

**Section 5: Flow 2 — Vaulting** — Vault-with-purchase via direct REST (UNSCHEDULED_POSTPAID), merchant-initiated charges via vault_id, vault token deletion, merchant booking detail with payment timeline (Lucide icons, running totals), ChargeAddonDialog with presets, FinalSettlementButton. Simulation mode with `sim_` prefix bypass. Checkout page: fee schedule timeline ($2,500 breakdown), terms checkbox gating PayPal button, PayPal-only fundingSource.

**Section 6: Flow 3 — Invoice** — Custom trip request form (destinations + activities with prices, dates, email, notes), auto-invoice creation + send on submission via PayPal Invoicing API v2, QR code generation, invoice payment link on confirmation page, merchant invoice detail with Open/Copy buttons + timeline. Trip request creates booking record for visibility.

**Section 7: Merchant Dashboard** — KPI stat cards (4), Recharts charts (donut, line, stacked bar), recent bookings table, simulation panel (6-step Flow 2 lifecycle with mock vault tokens).

### Pending

**Section 8: Polish & Integration Testing** — Not started. Includes: error banners, skeleton screens, ProcessingOverlay, E2E testing, responsive layout, edge cases, confirmation dialogs (shadcn AlertDialog replacing window.confirm), toast notifications.

### Key Bugs Fixed During Development

1. PayPal vault order: billing_plan/billing_cycles incompatible with UNSCHEDULED_POSTPAID — removed, use simple order + vault attributes
2. Invoice ID extraction: PayPal returns `{ rel, href }` not `{ id }` — extract from `href.split('/').pop()`
3. Send invoice: `send_to_invoicer` → `send_to_recipient` (customer must receive email)
4. Vault charge: amount must be coerced to Number, status must be verified as COMPLETED
5. Authorize: nested try/catch for partial capture failure to prevent orphaned authorizations
6. Origin URL: fallback to localhost when no referer/origin header for vault return_url
7. Async handler: trip-requests POST needed `async` after adding PayPal API calls

### Port Configuration
- Default: Server :3001, Client :5173
- Currently running: Server :3002, Client :5174 (port 3001 in use by other project)
- Vite proxy uses `process.env.PORT || 3001` for dynamic port
