# Section 6: Flow 3 — Invoice (Custom European Grand Tour)

> Implements custom trip request form, merchant invoice creation via PayPal Invoicing API v2 (direct REST), and invoice status tracking with polling.

---

## Task 6.1: Custom Trip Request Form

**File:** `client/src/pages/CustomTripRequestPage.tsx`

Build the request form at route `/trips/custom-european-tour` (reuse TripDetail page with a form section instead of PayPal buttons).

**Form fields:**
- **Date pickers** — `startDate` and `endDate` using shadcn `<Calendar>` + `<Popover>` (date-fns formatting)
- **Destination checkboxes** — each with name and price, stored as `Array<{ name: string; price: number }>`:

```ts
const DESTINATIONS = [
  { id: "paris", name: "Paris, France", price: 1200 },
  { id: "rome", name: "Rome, Italy", price: 1000 },
  { id: "santorini", name: "Santorini, Greece", price: 1500 },
  { id: "barcelona", name: "Barcelona, Spain", price: 900 },
  { id: "swiss-alps", name: "Swiss Alps", price: 1800 },
  { id: "amsterdam", name: "Amsterdam, Netherlands", price: 800 },
] as const;
```

- **Activity add-on checkboxes** — Guided museum tour ($150), Wine tasting ($100), Cooking class ($120), Boat excursion ($200)
- **Email** — text input, pre-filled from auth store
- **Notes** — textarea for special requests
- **Running total** — live-calculated: sum of selected destinations + activities. Show deposit (40%) and balance (60%) split beneath the total.

**File:** `client/src/data/destinations.ts` — Export `DESTINATIONS` and `ACTIVITIES` constants.

On submit, POST to `/api/trip-requests` and redirect to `/bookings` with a success toast.

---

## Task 6.2: Server — Trip Request Endpoint

**File:** `server/src/routes/trip-requests.ts`

```ts
// POST /api/trip-requests — save customer request
router.post("/", (req, res) => {
  const { email, startDate, endDate, destinations, activities, notes } = req.body;
  // Server-side recalculate total from destination/activity IDs (never trust client total)
  const totalEstimate = calcTotal(destinations, activities);
  const depositAmount = Math.round(totalEstimate * 0.4 * 100) / 100;
  const balanceAmount = totalEstimate - depositAmount;
  // Insert into trip_requests table, status = 'REQUEST_SUBMITTED'
  // Return { id, totalEstimate, depositAmount, balanceAmount, status }
});

// GET /api/trip-requests — merchant list (requires merchant role)
router.get("/", requireMerchant, (req, res) => { /* SELECT * FROM trip_requests ORDER BY created_at DESC */ });

// GET /api/trip-requests/:id — merchant detail
router.get("/:id", requireMerchant, (req, res) => { /* SELECT by id, parse JSON fields */ });
```

Register routes in `server/src/index.ts`: `app.use("/api/trip-requests", tripRequestRoutes)`.

---

## Task 6.3: Merchant Trip Requests List & Detail

**File:** `client/src/pages/merchant/TripRequestsPage.tsx`

Route: `/merchant/trip-requests`. Table with columns: Date, Customer Email, Destinations (pill badges), Total Estimate, Status, Action. Status badge colors: `REQUEST_SUBMITTED` = amber, `AWAITING_DEPOSIT` = blue, `DEPOSIT_RECEIVED` = sage, `FULLY_PAID` = green.

**File:** `client/src/pages/merchant/TripRequestDetailPage.tsx`

Route: `/merchant/trip-requests/:id`. Shows full request details (dates, destinations list with per-item prices, activities, notes, totals). Primary CTA: **"Create Invoice"** button (visible when status is `REQUEST_SUBMITTED`).

---

## Task 6.4: Server — Create Invoice (PayPal Invoicing API v2)

**File:** `server/src/routes/invoices.ts`

The `@paypal/paypal-server-sdk` may not include Invoicing. Use direct REST calls via `fetch` with OAuth token from `server/src/services/paypal.ts`.

```ts
// POST /api/invoices/create
router.post("/create", requireMerchant, async (req, res) => {
  const { tripRequestId } = req.body;
  const request = db.getTripRequest(tripRequestId);
  const token = await getPayPalAccessToken();

  const invoicePayload = {
    detail: {
      currency_code: "USD",
      note: `Custom European Grand Tour — ${request.destinations.length} destinations`,
      invoice_date: new Date().toISOString().split("T")[0],
      payment_term: { term_type: "NET_30" },
    },
    primary_recipients: [{ billing_info: { email_address: request.email } }],
    items: [
      { name: "European Tour — Deposit", quantity: "1", unit_amount: { currency_code: "USD", value: String(request.depositAmount) } },
      { name: "European Tour — Balance", quantity: "1", unit_amount: { currency_code: "USD", value: String(request.balanceAmount) } },
    ],
  };

  const resp = await fetch("https://api-m.sandbox.paypal.com/v2/invoicing/invoices", {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(invoicePayload),
  });
  const invoice = await resp.json();
  // Save invoice.id to trip_requests.booking_id (or create a booking record with invoice_id)
  // Create booking with payment_flow='invoice', status='REQUEST_SUBMITTED', invoice_id=invoice.id
  // Return { invoiceId: invoice.id, bookingId }
});
```

**File:** `server/src/services/paypal.ts` — Add `getPayPalAccessToken()` helper that caches the OAuth2 token (POST `/v1/oauth2/token` with client credentials).

---

## Task 6.5: Server — Send Invoice

**File:** `server/src/routes/invoices.ts` (append)

```ts
// POST /api/invoices/:id/send
router.post("/:id/send", requireMerchant, async (req, res) => {
  const booking = db.getBookingByInvoiceId(req.params.id);
  const token = await getPayPalAccessToken();
  await fetch(`https://api-m.sandbox.paypal.com/v2/invoicing/invoices/${req.params.id}/send`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ send_to_recipient: true }),
  });
  // Update booking status to 'AWAITING_DEPOSIT', update trip_request status
  db.updateBookingStatus(booking.id, "AWAITING_DEPOSIT");
  res.json({ status: "AWAITING_DEPOSIT" });
});
```

---

## Task 6.6: Server — Poll Invoice Status

**File:** `server/src/routes/invoices.ts` (append)

```ts
// GET /api/invoices/:id/status
router.get("/:id/status", requireMerchant, async (req, res) => {
  const token = await getPayPalAccessToken();
  const resp = await fetch(`https://api-m.sandbox.paypal.com/v2/invoicing/invoices/${req.params.id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const invoice = await resp.json();
  // Map PayPal invoice status + payments.transactions to our status:
  // invoice.status === 'SENT' && no payments → AWAITING_DEPOSIT
  // invoice.status === 'PARTIALLY_PAID' → DEPOSIT_RECEIVED
  // invoice.status === 'PAID' → FULLY_PAID
  const newStatus = mapInvoiceStatus(invoice);
  db.updateBookingStatus(booking.id, newStatus);
  // Also update paid_amount from invoice.payments.paid_amount.value
  res.json({ status: newStatus, paidAmount: invoice.payments?.paid_amount?.value ?? "0.00" });
});
```

No webhooks needed. Merchant clicks **"Refresh Status"** button on the invoice detail page, which calls this endpoint. Status also auto-refreshes on page load via `useEffect`.

---

## Task 6.7: Merchant Invoice Management Page

**File:** `client/src/pages/merchant/InvoicesPage.tsx`

Route: `/merchant/invoices`. Table listing all invoice-flow bookings: Reference, Customer, Total, Paid, Status, Actions.

**File:** `client/src/pages/merchant/InvoiceDetailPage.tsx`

Route: `/merchant/invoices/:id`. Shows:
- Invoice summary card (recipient, dates, deposit vs balance amounts)
- Status badge with transition history: `REQUEST_SUBMITTED` -> `AWAITING_DEPOSIT` -> `DEPOSIT_RECEIVED` -> `FULLY_PAID`
- **"Send Invoice"** button (when status is `REQUEST_SUBMITTED` and invoice draft exists)
- **"Refresh Status"** button (when status is `AWAITING_DEPOSIT` or `DEPOSIT_RECEIVED`) — calls `GET /api/invoices/:id/status` and updates UI
- Payment progress bar (paid / total)

---

## Task 6.8: Wire Routes & Integration

**Files to update:**
- `client/src/App.tsx` — Add routes: `/merchant/trip-requests`, `/merchant/trip-requests/:id`, `/merchant/invoices`, `/merchant/invoices/:id`
- `server/src/index.ts` — Mount `invoiceRoutes` at `/api/invoices`
- `client/src/lib/api.ts` — Add fetch helpers: `submitTripRequest()`, `createInvoice()`, `sendInvoice()`, `refreshInvoiceStatus()`, `getTripRequests()`, `getTripRequest()`

**Commit:** `feat: implement Flow 3 — invoice payment flow with custom trip requests, PayPal Invoicing API v2, and merchant invoice management`
