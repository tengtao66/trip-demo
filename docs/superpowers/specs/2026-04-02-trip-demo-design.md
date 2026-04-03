# TERRA — Trip Demo Design Spec

## 1. Overview

**TERRA — Guided Tours** is an online trip booking demo showcasing three PayPal payment integration patterns through a tour package business. Customers browse curated tour packages, view detailed itineraries, and complete bookings using different PayPal payment flows. A merchant dashboard provides booking management, payment actions, and business analytics.

**Key differentiator from airline project:** Uses PayPal JS SDK v5 with react-paypal-js v8.x (not SDK v6/v9+), and demonstrates authorize/capture, vaulting, and invoice API flows — none of which are in the airline project.

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + shadcn/ui (New York) |
| State | Zustand |
| Routing | React Router v7 |
| PayPal (client) | `@paypal/react-paypal-js` v8.x (JS SDK v5) |
| Backend | Express v5 + TypeScript |
| PayPal (server) | `@paypal/paypal-server-sdk` |
| Database | SQLite via `better-sqlite3` |
| Charts | Recharts |
| Icons | Lucide React |
| Monorepo | npm workspaces (`client/` + `server/`) |

## 3. Visual Design

### Brand: TERRA — Guided Tours

**Style:** Modern earth tones (2026 trend), clean, warm, photography-forward.

**Typography:** Inter (headings weight 600, body weight 400).

### Color Tokens

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#5C3D2E` | Mocha — headings, nav background, primary text emphasis |
| `accent` | `#A0522D` | Terracotta — CTAs, buttons, active states, links |
| `secondary` | `#86A873` | Sage — success states, positive metrics, invoice flow |
| `background` | `#FAF6F1` | Alpine Oat — page background |
| `card` | `#FFFDF9` | Ivory — card surfaces |
| `border` | `#E8DFD4` | Warm grey — card borders, dividers |
| `text` | `#3D2B1F` | Dark mocha — primary body text |
| `text-muted` | `#8B7355` | Warm grey — secondary text, labels |
| `text-light` | `#C4956A` | Light mocha — disabled text, placeholders |
| `warning` | `#B8860B` | Warm amber — pending states, attention needed (WCAG AA 4.5:1 on card bg) |
| `destructive` | `#DC2626` | Red — error, cancel, destructive actions |
| `surface-highlight` | `#F5EDE3` | Light warm — hover states, simulation banner bg |
| `surface-muted` | `#F0EBE3` | Beige — badges, tags |

### Design Principles

- Light background with white cards — clean and simple
- No heavy gradients on surfaces — borders only for elevation
- Photography-forward trip cards — large image ratio
- Consistent 8px spacing scale
- Lucide React icons throughout (no emoji)
- All text meets WCAG AA contrast (4.5:1 minimum)

### UX Standards (All Flows)

**Confirmation dialogs:** All destructive/irreversible actions (Capture Balance, Void Authorization, Delete Vault, Reauthorize) must show a confirmation dialog before executing. Use shadcn/ui AlertDialog with descriptive message and Cancel/Confirm buttons. Destructive actions use red confirm button.

**Toast notifications:** After all payment actions (capture, charge, void, send invoice, refresh status), show a brief success/error toast (3-5s auto-dismiss). Use `aria-live="polite"` for screen reader support.

**Loading states on action buttons:** All action buttons show a spinner icon and disable during API calls to prevent double-click. Button text changes to "Capturing..." / "Charging..." / "Sending..." during processing.

**Back navigation:** All detail pages (customer and merchant) show a "← Back to Bookings" (or "← Back to Invoices") link above the page header.

**Timeline consistency:** All vertical timelines use 16px dots with 6px inner white circles, 2px connecting line in `border` color. Completed entries use `secondary` (Sage) dots, pending entries use `warning` (Amber) dots, failed entries use `destructive` (Red) dots. Add status icons next to amounts: ✓ captured, ◷ pending, ✗ failed.

**Customer card:** Always show trip duration in parentheses after dates, e.g., "Apr 5 – Apr 11, 2026 (7 days)".

**Monospace styling:** All IDs (authorization ID, order ID, vault token, invoice ID) use consistent monospace font with `surface-muted` background and 3px border-radius.

## 4. Authentication

Mock authentication with pre-seeded users. No real auth flow.

### Pre-seeded Users

| User | Role | Purpose |
|------|------|---------|
| `customer@terra.demo` | Customer | Browse trips, make bookings, pay invoices |
| `merchant@terra.demo` | Merchant | Manage bookings, capture payments, create invoices, simulation |

### Implementation

- Login page shows two clickable user cards (customer / merchant)
- Clicking a card sets the role in Zustand store + localStorage
- Role switch available in nav bar header
- No password, no token exchange — purely client-side role state
- Server receives role via `X-User-Role` header (or similar) for role-based API responses

## 5. Routes

### Shared Routes

| Route | Page | Description |
|-------|------|-------------|
| `/login` | Login | Two clickable user cards (customer / merchant). Unauthenticated users redirect here. |

### Route Protection

- Unauthenticated users → redirect to `/login`
- Customer role accessing `/merchant/*` → redirect to `/`
- Merchant role can access all routes (customer + merchant)

### Customer Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing page with trip listings |
| `/trips/:slug` | Trip Detail | Itinerary, photos, pricing, Book Now CTA |
| `/checkout/:slug` | Checkout | PayPal payment flow (varies by trip type) |
| `/bookings` | My Bookings | List of customer's bookings with status |
| `/bookings/:id` | Booking Detail | Payment status, transaction history |

### Merchant Routes

| Route | Page | Description |
|-------|------|-------------|
| `/merchant` | Dashboard | KPI stats, charts, recent bookings, simulation mode |
| `/merchant/bookings` | All Bookings | Filterable list of all bookings |
| `/merchant/bookings/:id` | Booking Detail | Payment actions (capture, charge, void) |
| `/merchant/invoices` | Invoices | Invoice list with status |
| `/merchant/invoices/create` | Create Invoice | Create invoice from custom trip request |
| `/merchant/trip-requests` | Trip Requests | List of custom trip requests from customers |

## 6. Sample Trip Data

### Trip 1: Tokyo Cherry Blossom Express

| Field | Value |
|-------|-------|
| Slug | `tokyo-cherry-blossom` |
| Duration | 3 days |
| Price | $800 total |
| Deposit | $200 |
| Balance | $600 (within 30 days) |
| Payment Flow | Flow 1 — Authorize & Capture |
| Badge | "Reserve Now" |
| Description | Cherry blossom season in Tokyo. Temples, parks, tea ceremonies. |
| Itinerary | Day 1: Arrival, Shinjuku Gyoen, welcome dinner. Day 2: Ueno Park, Senso-ji, tea ceremony. Day 3: Chidorigafuchi, Imperial Palace, departure. |

### Trip 2: Bali Adventure Retreat

| Field | Value |
|-------|-------|
| Slug | `bali-adventure` |
| Duration | 7 days |
| Base Price | $2,500 |
| Setup Fee | $500 |
| Available Add-ons | Spa treatment ($150), Scuba diving ($200), Cooking class ($80), Volcano sunrise trek ($120) |
| Payment Flow | Flow 2 — Vault (UNSCHEDULED_POSTPAID) |
| Badge | "Add-ons" |
| Description | Multi-day adventure in Bali. Surfing, temples, rice terraces, spa. |
| Itinerary | Day 1: Arrival, Seminyak beach. Day 2: Ubud rice terraces. Day 3: Temple tour. Day 4-5: Optional activities. Day 6: Beach day. Day 7: Departure. |

**Fee Schedule Breakdown ($2,500 total):**

| Day | Charge | Amount | Type |
|-----|--------|--------|------|
| Booking | Setup Fee (Deposit) | $500 | setup_fee |
| Day 2 | Balinese Spa Treatment | $150 | addon |
| Day 3 | Scuba Diving Session | $200 | addon |
| Day 4 | Ubud City Walk Guidance | $80 | addon |
| Day 5 | Kecak Fire Dance Event | $120 | addon |
| Day 7 | Final Settlement (Remaining) | $1,450 | final |

This fee schedule is displayed on the vault checkout page so buyers can see exactly how the $2,500 is distributed across the trip timeline.

### Trip 3: Custom European Grand Tour

| Field | Value |
|-------|-------|
| Slug | `custom-european-tour` |
| Duration | 10-14 days |
| Price Range | $5,000 - $15,000 |
| Payment Flow | Flow 3 — Invoice API |
| Badge | "Invoice" |
| Description | Design your dream European itinerary. |

#### Request Form Template

Customer fills out a form with:
- **Time period:** Start date + end date (date pickers)
- **Destinations** (pick from list with prices):
  - Paris, France — $1,200
  - Rome, Italy — $1,000
  - Santorini, Greece — $1,500
  - Barcelona, Spain — $900
  - Swiss Alps — $1,800
  - Amsterdam, Netherlands — $800
- **Activities** (optional add-ons per destination):
  - Guided museum tour — $150
  - Wine tasting — $100
  - Cooking class — $120
  - Boat excursion — $200
- **Email:** For invoice delivery
- **Notes:** Free text for special requests

## 7. Payment Flows

### Flow 1: Authorize & Capture (Tokyo Cherry Blossom)

**PayPal SDK Configuration:**
```js
<PayPalScriptProvider options={{
  clientId: PAYPAL_CLIENT_ID,
  intent: "authorize",
  currency: "USD"
}}>
  <PayPalButtons createOrder={createOrder} onApprove={onApprove} />
</PayPalScriptProvider>
```

**Sequence:**

1. Customer clicks "Book Now" on trip detail page
2. Checkout page shows pricing breakdown: $800 total, $200 deposit now, $600 balance later
3. Customer clicks PayPal button → PayPal popup
4. **Client `createOrder`:** Calls `POST /api/orders/create` with trip details
5. **Server creates order** with `intent: "AUTHORIZE"`, amount: $800
6. Customer approves in PayPal popup
7. **Client `onApprove`:** Calls `POST /api/orders/:orderId/authorize`
8. **Server authorizes order** → receives `authorization_id` for full $800
9. **Server immediately partial-captures $200** (deposit) within the same request — calls `POST /v2/payments/authorizations/:authId/capture` with `amount: { value: "200.00" }` and `final_capture: false`
10. **Server saves to SQLite:** booking record, authorization_id, deposit capture ID, authorization expiration date
11. **Server returns** booking reference + confirmation data to client
12. Customer sees confirmation page with booking reference and payment breakdown
13. **Later (merchant dashboard):** Merchant clicks "Capture Balance" → server captures remaining $600 via same authorization

**Booking Statuses:** `DEPOSIT_AUTHORIZED` → `DEPOSIT_CAPTURED` → `FULLY_CAPTURED` (or `VOIDED` / `EXPIRED`)

> **Note:** `DEPOSIT_AUTHORIZED` is a brief transitional state during step 8-9. Most bookings will be created directly in `DEPOSIT_CAPTURED` status since the partial capture happens immediately. `DEPOSIT_AUTHORIZED` is only visible if the partial capture fails.

**Key Constraints:**
- Authorization valid for 29 days
- 3-day honor period for capture
- Can reauthorize if honor period expires (new auth ID)
- Dashboard shows expiration countdown

**Server Endpoints:**
- `POST /api/orders/create` — Create order with intent=AUTHORIZE
- `POST /api/orders/:orderId/authorize` — Authorize the order
- `POST /api/payments/authorizations/:authId/capture` — Capture (partial or full)
- `POST /api/payments/authorizations/:authId/void` — Void authorization
- `POST /api/payments/authorizations/:authId/reauthorize` — Reauthorize if expired

**Merchant Booking Detail View (`/merchant/bookings/:id` — Authorize Flow):**

The booking detail page for authorize bookings is split into two columns:

*Left column — Booking Info:*
- Customer card: name, email, booking date, trip dates
- **Authorization Status card** (the storytelling centerpiece):
  - Two metric boxes: Authorized Amount ($800) vs Remaining to Capture ($600)
  - Authorization ID + PayPal Order ID (monospace)
  - Created/Expires dates
  - **Countdown timer** — days:hours:mins remaining in the 29-day authorization window
  - Honor period indicator (green when within 3-day window, warning when expired)
- Action buttons that change based on state:
  - Normal: "Capture Balance ($600)" + "Void"
  - Honor period expired: "Reauthorize ($600)" + "Try Capture Anyway" + "Void"
  - Fully captured: No actions (green success state)

*Right column — Payment Timeline & Explainer:*
- **Two-phase payment timeline:**
  - Phase 1 (Booking): Groups authorization of full amount + immediate partial capture of deposit together
  - Phase 2 (Settlement): Shows pending balance capture with authorization deadline
- **"How it Works" explainer** — 4-step numbered guide:
  1. Customer approves full amount ($800) — funds held, not charged
  2. Merchant immediately captures deposit ($200) as partial capture
  3. Merchant verifies trip details (availability, itinerary)
  4. Merchant captures remaining balance ($600) within 29-day window

**Three visual states:**
- `DEPOSIT_CAPTURED` — Amber authorization card with countdown timer, capture button active
- `HONOR_EXPIRED` — Red border, warning message, "Reauthorize" button replaces "Capture"
- `FULLY_CAPTURED` — Green success card with deposit + balance = total breakdown and capture dates

> **Mockup:** See `docs/ui/booking-detail-authorize.html` for the full visual mockup with all three states.

**Flow 1 UX enhancements:**
- **Authorization window progress bar:** Horizontal bar below the countdown timer showing position in the 29-day window (green fill) with a marker line at the 3-day honor period boundary. Shows "Day X of 29" label.
- Confirmation dialog before Capture Balance, Void, and Reauthorize actions.

### Flow 2: Vaulting (Bali Adventure Retreat)

**PayPal SDK Configuration:**
```js
<PayPalScriptProvider options={{
  clientId: PAYPAL_CLIENT_ID,
  intent: "capture",
  vault: true,
  currency: "USD"
}}>
  <PayPalButtons createOrder={createOrder} onApprove={onApprove} />
</PayPalScriptProvider>
```

**Initial Purchase (Vault with Purchase):**

1. Customer clicks "Book Now" on Bali trip detail page
2. Checkout page shows:
   - **Fee schedule timeline** — Lists every charge across the trip with day indicators: Booking ($500 setup), Day 2 (Spa $150), Day 3 (Diving $200), Day 4 (City Walk $80), Day 5 (Event $120), Day 7 (Final $1,450). Color-coded badges per charge type.
   - **Payment Authorization Terms** — Explains vault token lifecycle (charge now, charge during trip, charge at end, delete token after settlement)
   - **Terms checkbox** — Buyer must check "I agree to the payment authorization terms" before the PayPal button becomes active. Button is disabled with opacity + hint text until accepted.
   - **PayPal button only** — Uses `fundingSource="paypal"` (no Debit/Credit card option for vault flow)
3. Customer checks terms checkbox, clicks PayPal button → approves & saves payment method
4. **Server creates order** with vault instructions:

```json
{
  "intent": "CAPTURE",
  "purchase_units": [{
    "amount": { "currency_code": "USD", "value": "500" },
    "description": "Bali Adventure Retreat - Setup Fee"
  }],
  "payment_source": {
    "paypal": {
      "attributes": {
        "vault": {
          "store_in_vault": "ON_SUCCESS",
          "usage_type": "MERCHANT",
          "usage_pattern": "UNSCHEDULED_POSTPAID"
        }
      },
      "experience_context": {
        "return_url": "...",
        "cancel_url": "..."
      }
    }
  }
}
```

> **Note:** The `billing_plan` / `billing_cycles` structure belongs to the Subscriptions API, not Orders v2. For vault-with-purchase using `UNSCHEDULED_POSTPAID`, a standard order with `payment_source.paypal.attributes.vault` is sufficient.

5. **Server captures $500 setup fee** + extracts vault token (payment_token ID) from response
6. **Server saves:** booking, vault_token_id, setup fee capture

**Subsequent Charges (Merchant-initiated):**

7. Merchant adds services from dashboard (e.g., spa $150)
8. **Server creates order with saved vault token:**

```json
{
  "intent": "CAPTURE",
  "purchase_units": [{
    "amount": { "currency_code": "USD", "value": "150" },
    "description": "Spa Treatment Add-on"
  }],
  "payment_source": {
    "paypal": {
      "vault_id": "<vault_token_id>"
    }
  }
}
```

> **Note:** The `vault_id` alone is sufficient for merchant-initiated subsequent charges. The `stored_credential` block is a legacy Braintree/v1 structure and is not part of the Orders v2 API schema.

9. After trip ends, merchant charges final balance → then deletes vault token via `DELETE /v3/vault/payment-tokens/:id`

**Booking Statuses:** `ACTIVE` → `IN_PROGRESS` → `COMPLETED`

**Simulation Mode:**
- "Fast-forward" button on merchant dashboard
- Steps through: Day 0 (setup $500) → Day 3 (spa $150) → Day 5 (diving $200) → Day 7 (final + vault cleanup)
- Each step shows the charge being created and captured in real-time

**Server Endpoints:**
- `POST /api/orders/create` — Create order with vault instructions
- `POST /api/orders/:orderId/capture` — Capture setup fee + extract vault token
- `POST /api/vault/:vaultId/charge` — Create + capture order using vault token
- `DELETE /api/vault/:vaultId` — Delete vault token (calls PayPal API)
- `GET /api/bookings/:id/charges` — List all charges for a booking

**Merchant Booking Detail View (`/merchant/bookings/:id`):**

The booking detail page for vault bookings is the key storytelling page of the demo. It has two columns:

*Left column — Booking Info:*
- Customer card: name, email, booking date, trip dates
- Payment summary: setup fee + add-on services + final settlement = total, with a progress bar showing % of payments completed
- Action buttons: "+ Charge Add-on" (opens charge dialog), "Final Settlement" (captures remaining balance), "Delete Vault" (destructive, after trip complete)

*Right column — Payment Timeline:*

A vertical timeline listing every charge in chronological order. Each entry shows:
- Charge name (e.g., "Balinese Spa Treatment")
- Type label (e.g., "Activity add-on • Merchant-initiated")
- Timestamp with trip day indicator (e.g., "Apr 6, 2026 — 2:15 PM (Day 2)")
- Amount and status (CAPTURED in green, PENDING in amber)

Sample timeline for Bali Adventure Retreat:

| Order | Day | Charge | Type | Amount | Status |
|-------|-----|--------|------|--------|--------|
| 1 | Booking | Setup Fee (Deposit) | Vault created | $500.00 | CAPTURED |
| 2 | Day 2 | Balinese Spa Treatment | Activity add-on | $150.00 | CAPTURED |
| 3 | Day 3 | Scuba Diving Session | Activity add-on | $200.00 | CAPTURED |
| 4 | Day 4 | Ubud City Walk Guidance | Guide service fee | $80.00 | CAPTURED |
| 5 | Day 5 | Kecak Fire Dance Event | Event ticket fee | $120.00 | CAPTURED |
| 6 | After trip | Final Settlement | Remaining balance | $1,450.00 | PENDING |

The pending final settlement is visually distinct (dashed amber border) to show it's the next merchant action. After final settlement, the vault token is automatically deleted and booking status changes to `COMPLETED`.

This timeline view helps the demo audience understand:
1. How the vault token is created with the initial deposit
2. How the merchant charges add-on services during the trip at variable amounts and times (UNSCHEDULED_POSTPAID)
3. How the final balance is settled after the trip
4. How the vault lifecycle is cleanly closed

> **Mockup:** See `docs/ui/booking-detail-vault.html` for the full visual mockup.

**Flow 2 UX enhancements:**

- **Charge type icons:** Each timeline entry shows a Lucide icon by type: Key (setup fee), Sparkles (spa), Waves (diving), MapPin (city walk), Ticket (event), CircleDollarSign (final settlement).
- **Running total:** Each timeline entry shows a cumulative total in muted text (e.g., "$150 — total: $650") so the audience sees the balance building up.
- **Preset add-on options:** "Charge Add-on" dialog offers predefined options (Spa $150, Diving $200, Cooking $80, Trek $120) with a "Custom" option for free-form charges.
- **Empty timeline state:** If no add-on charges yet, show "No charges yet — use '+ Charge Add-on' to record a service."
- Confirmation dialog before Delete Vault and Final Settlement actions.

### Flow 3: Invoice (Custom European Grand Tour)

**No JS SDK needed for invoice flow** — this is server-to-server via PayPal Invoicing API v2.

**Sequence:**

1. Customer navigates to "Design Your Trip" (Custom European Tour detail page)
2. Customer fills out request form: dates, destinations, activities, email, notes
3. Customer submits → `POST /api/trip-requests`
4. **Server saves trip request** to SQLite, status: `REQUEST_SUBMITTED`
5. Merchant sees request on dashboard → reviews details
6. Merchant clicks "Create Invoice" → fills in any adjustments
7. **Server creates invoice** via PayPal Invoicing API v2:
   - `POST /v2/invoicing/invoices` — Create draft invoice
   - Invoice contains 2 line items: Deposit amount + Balance amount
   - `POST /v2/invoicing/invoices/:invoiceId/send` — Send to customer email
8. Status changes to `AWAITING_DEPOSIT`
9. Customer receives email from PayPal with payment link
10. Customer pays deposit → status updates to `DEPOSIT_RECEIVED`
11. Customer pays balance → status becomes `FULLY_PAID`

> **Status updates for invoice:** Use polling, not webhooks (avoids public URL and signature verification complexity for a demo). Merchant clicks "Refresh Status" on the invoice detail page, which calls `GET /v2/invoicing/invoices/:invoiceId` and checks the `status` and `payments` fields. Status also refreshes automatically on page load.

**Booking Statuses:** `REQUEST_SUBMITTED` → `AWAITING_DEPOSIT` → `DEPOSIT_RECEIVED` → `FULLY_PAID`

**Server Endpoints:**
- `POST /api/trip-requests` — Save custom trip request
- `GET /api/trip-requests` — List all requests (merchant)
- `GET /api/trip-requests/:id` — Get request details
- `POST /api/invoices/create` — Create PayPal invoice from trip request
- `POST /api/invoices/:id/send` — Send invoice to customer
- `GET /api/invoices/:id/status` — Check invoice payment status

**Merchant Invoice Detail View (`/merchant/invoices/:id`):**

The invoice detail page is split into two columns:

*Left column — Invoice Info:*
- Customer card: name, email, request date, trip dates
- **Invoice Payment Link card** (prominent blue highlight): Displays the PayPal-hosted invoice URL from `detail.metadata.recipient_view_url` in the API response. Includes:
  - The full invoice URL (e.g., `https://www.sandbox.paypal.com/invoice/p/#INV2-...`)
  - **"Open"** button — opens invoice in new tab so audience can see the customer's payment view
  - **"Copy"** button — copies link to clipboard for sharing
  - Helper tip for presenters
- Payment progress: deposit vs balance with progress bar

*Right column — Invoice Details:*
- Line items grouped by type: Destinations (with prices), Activities (with quantities), Custom notes
- Subtotal + service fee breakdown → invoice total
- Invoice timeline: REQUEST_SUBMITTED → Invoice Created & Sent → Deposit Received → Awaiting Balance

This page is critical for demo presentations — the "Open" button lets the audience see the actual PayPal invoice experience in real-time.

> **Mockup:** See `docs/ui/invoice-detail-merchant.html` for the full visual mockup.

**Flow 3 UX enhancements:**

- **Copy button feedback:** "Copy" button text changes to "Copied ✓" (green) for 2 seconds, then reverts. No toast needed — inline feedback is sufficient.
- **"Last checked" timestamp:** Show "Last checked: 2 minutes ago" next to the Refresh Status button. Updates on each poll. Helps audience understand the polling mechanism.
- **Email sent indicator:** Near the invoice link card, show "Email sent to: bob.wilson@email.com ✓" to confirm PayPal sent the real email.
- **Deposit/balance as separate invoice items:** When creating the PayPal invoice, label the two line items clearly (e.g., "European Grand Tour — Deposit" and "European Grand Tour — Balance") so the PayPal-hosted view is self-explanatory.

## 8. Database Schema (SQLite)

### users

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| email | TEXT UNIQUE | User email |
| name | TEXT | Display name |
| role | TEXT | 'customer' or 'merchant' |

### trips

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| slug | TEXT UNIQUE | URL slug |
| name | TEXT | Trip name |
| description | TEXT | Short description |
| duration_days | INTEGER | Trip duration |
| base_price | REAL | Base price in USD |
| deposit_amount | REAL | Required deposit |
| payment_flow | TEXT | 'authorize', 'vault', or 'invoice' |
| itinerary | TEXT | JSON string of day-by-day itinerary |
| image_gradient | TEXT | CSS gradient fallback for dev; use Unsplash URLs for real images |

### bookings

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| booking_reference | TEXT UNIQUE | Human-readable ref (e.g., TERRA-XXXX) |
| user_id | TEXT FK | References users.id |
| trip_id | TEXT FK | References trips.id |
| status | TEXT | Booking status |
| payment_flow | TEXT | 'authorize', 'vault', or 'invoice' |
| total_amount | REAL | Total booking cost |
| paid_amount | REAL | Amount paid so far |
| paypal_order_id | TEXT | PayPal order ID |
| authorization_id | TEXT | PayPal authorization ID (Flow 1) |
| authorization_expires_at | TEXT | ISO timestamp (Flow 1) |
| vault_token_id | TEXT | PayPal vault token ID (Flow 2) |
| invoice_id | TEXT | PayPal invoice ID (Flow 3) |
| invoice_url | TEXT | PayPal-hosted invoice URL from `detail.metadata.recipient_view_url` (Flow 3) |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

### booking_charges

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| booking_id | TEXT FK | References bookings.id |
| type | TEXT | 'deposit', 'balance', 'addon', 'setup_fee', 'final' |
| description | TEXT | Charge description |
| amount | REAL | Charge amount |
| paypal_capture_id | TEXT | PayPal capture ID |
| status | TEXT | 'pending', 'completed', 'failed' |
| created_at | TEXT | ISO timestamp |

### trip_requests

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | References users.id |
| email | TEXT | Invoice recipient email |
| start_date | TEXT | Trip start date |
| end_date | TEXT | Trip end date |
| destinations | TEXT | JSON array of selected destinations |
| activities | TEXT | JSON array of selected activities |
| notes | TEXT | Customer special requests |
| total_estimate | REAL | Calculated total |
| deposit_amount | REAL | Deposit portion |
| balance_amount | REAL | Balance portion |
| booking_id | TEXT FK | References bookings.id (set when invoice/booking created) |
| status | TEXT | Request status |
| created_at | TEXT | ISO timestamp |

## 9. Vite Proxy & Dev Setup

Client dev server (port 5173) proxies `/api` requests to Express (port 3001) via `vite.config.ts`:

```ts
server: {
  proxy: { "/api": "http://localhost:3001" }
}
```

`.env` file lives at the monorepo root. Vite config uses `envDir: ".."` to read it.

## 10. Merchant Dashboard

### KPI Cards (top row)

| Metric | Data Source |
|--------|-------------|
| Active Bookings | Count of bookings with non-terminal status |
| Pending Captures | Count of Flow 1 bookings in DEPOSIT_AUTHORIZED status |
| Open Invoices | Count of Flow 3 bookings in AWAITING_DEPOSIT or DEPOSIT_RECEIVED |
| Monthly Revenue | Sum of booking_charges.amount where status = 'completed' in current month |

### Charts (Recharts)

| Chart | Type | Data |
|-------|------|------|
| Revenue by Flow | Donut | Revenue grouped by payment_flow (authorize/vault/invoice) |
| Bookings Trend | Line | Booking count per day over last 30 days |
| Monthly Revenue | Stacked Bar | Revenue by charge type (deposits/final/add-ons) per month |

**Chart color mapping:**
- Primary/Authorize: `#5C3D2E` (Mocha)
- Accent/Vault: `#A0522D` (Terracotta)
- Secondary/Invoice: `#86A873` (Sage)

### Recent Bookings Table

Columns: Customer, Trip, Flow, Status, Amount, Action

Actions vary by flow:
- Flow 1: "Capture" button (when DEPOSIT_AUTHORIZED)
- Flow 2: "Charge" button (when ACTIVE/IN_PROGRESS)
- Flow 3: "Waiting" label (payment via invoice link)

### Simulation Mode

Banner at bottom of dashboard with "Start Simulation →" button.

Simulation walks through a Flow 2 booking lifecycle:
1. **Step 0:** Setup fee captured ($500) — booking created
2. **Step 1:** Day 3 — Spa treatment charged ($150)
3. **Step 2:** Day 5 — Scuba diving charged ($200)
4. **Step 3:** Day 7 — Final balance charged, vault token deleted, booking COMPLETED

Each step shows a progress indicator and the charge being processed. Auto-advances with a 3-second delay between steps, or manual "Next Step" button.

## 10. Project Structure

```
trip-demo/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── payment/          # PayPal button, checkout components
│   │   │   ├── trips/            # Trip card, trip detail, itinerary
│   │   │   ├── merchant/         # Dashboard, booking manager, charts, simulation
│   │   │   ├── layout/           # Header, footer, role switcher
│   │   │   └── ui/               # shadcn/ui components
│   │   ├── pages/                # Route-level page components
│   │   ├── stores/               # Zustand stores (auth, booking, payment)
│   │   ├── lib/                  # API helpers, formatters, constants
│   │   ├── data/                 # Static trip data, destinations, activities
│   │   ├── main.tsx              # PayPalScriptProvider setup
│   │   └── App.tsx               # Router configuration
│   ├── package.json
│   └── vite.config.ts
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── orders.ts         # Create, authorize, capture
│   │   │   ├── vault.ts          # Vault charge, delete
│   │   │   ├── invoices.ts       # Create, send, status
│   │   │   ├── bookings.ts       # CRUD, charges list
│   │   │   └── trip-requests.ts  # Custom trip requests
│   │   ├── services/
│   │   │   ├── paypal.ts         # PayPal SDK client init
│   │   │   └── db.ts             # SQLite connection + queries
│   │   ├── middleware/
│   │   │   └── auth.ts           # Mock auth middleware
│   │   ├── db/
│   │   │   ├── schema.sql        # Table creation
│   │   │   └── seed.sql          # Pre-seeded users + trips
│   │   └── index.ts              # Express app entry
│   └── package.json
├── docs/
│   ├── ui/                       # Design mockups (HTML)
│   ├── superpowers/              # Specs and plans
│   ├── context.md
│   ├── todos.md
│   ├── progress.md
│   ├── debug-log.md
│   └── test-cases.md
└── package.json                  # Workspace root
```

## 11. Environment Variables

```env
PAYPAL_CLIENT_ID=<sandbox client ID>
PAYPAL_CLIENT_SECRET=<sandbox client secret>
NODE_ENV=development
PORT=3001
```

## 12. Key Implementation Notes

### PayPalScriptProvider Setup

The provider needs different configurations per flow:
- **Flow 1:** `intent: "authorize"`
- **Flow 2:** `intent: "capture"`, `vault: true`
- **Flow 3:** No SDK needed (server-to-server invoice)

**Approach:** Use `usePayPalScriptReducer` to dispatch `resetOptions` when navigating between trips with different intents. Or render separate provider contexts per checkout page.

### Server-Side Price Calculation

Never trust client-supplied amounts. Server looks up trip by slug, calculates totals from the database, and uses those values in PayPal API calls.

### Booking Reference Generation

Generate human-readable references like `TERRA-A1B2` (prefix + 4 alphanumeric chars). Check uniqueness before saving.

### Error Handling

- PayPal API errors surfaced to client as structured JSON `{ error: string, details?: string }`
- Checkout failures show inline error banner (not alert/modal)
- Authorization expiration warnings shown 3 days before expiry on merchant dashboard
