# Section 7: Merchant Dashboard

## 7.1 Server — KPI Stats Endpoint

**File:** `server/src/routes/merchant.ts`

Add `GET /api/merchant/stats` returning four KPIs:

```ts
router.get('/stats', requireMerchant, (req, res) => {
  const activeBookings = db.prepare(
    `SELECT COUNT(*) as count FROM bookings WHERE status NOT IN ('FULLY_CAPTURED','COMPLETED','FULLY_PAID','VOIDED','EXPIRED')`
  ).get();
  const pendingCaptures = db.prepare(
    `SELECT COUNT(*) as count FROM bookings WHERE payment_flow = 'authorize' AND status = 'DEPOSIT_CAPTURED'`
  ).get();
  const openInvoices = db.prepare(
    `SELECT COUNT(*) as count FROM bookings WHERE payment_flow = 'invoice' AND status IN ('AWAITING_DEPOSIT','DEPOSIT_RECEIVED')`
  ).get();
  const monthlyRevenue = db.prepare(
    `SELECT COALESCE(SUM(amount),0) as total FROM booking_charges WHERE status = 'completed' AND created_at >= date('now','start of month')`
  ).get();
  res.json({ activeBookings: activeBookings.count, pendingCaptures: pendingCaptures.count, openInvoices: openInvoices.count, monthlyRevenue: monthlyRevenue.total });
});
```

Register in `server/src/index.ts`: `app.use('/api/merchant', merchantRouter)`.

## 7.2 Server — Chart Data Endpoint

**File:** `server/src/routes/merchant.ts`

Add `GET /api/merchant/charts` returning three datasets:

- **revenueByFlow**: `SELECT payment_flow, SUM(amount) as total FROM booking_charges bc JOIN bookings b ON bc.booking_id = b.id WHERE bc.status = 'completed' GROUP BY b.payment_flow` — returns `[{ flow: 'authorize', total }, ...]`
- **dailyBookings**: `SELECT DATE(created_at) as date, COUNT(*) as count FROM bookings WHERE created_at >= date('now','-30 days') GROUP BY DATE(created_at) ORDER BY date` — fill missing dates with 0 on the client
- **monthlyRevenue**: `SELECT strftime('%Y-%m', bc.created_at) as month, bc.type, SUM(bc.amount) as total FROM booking_charges bc WHERE bc.status = 'completed' GROUP BY month, bc.type ORDER BY month` — pivot types into `{ month, deposit, final, addon }` rows

## 7.3 KPI Stat Cards

**File:** `client/src/components/merchant/StatCards.tsx`

Four cards in a `grid grid-cols-2 lg:grid-cols-4 gap-4` layout. Each card uses `bg-card border border-border rounded-xl p-5`. Content: Lucide icon (top-left, `text-accent`), label (`text-sm text-text-muted`), value (`text-2xl font-semibold text-text`). Cards: Activity (active bookings), CreditCard (pending captures), FileText (open invoices), DollarSign (monthly revenue formatted as `$X,XXX`).

Fetch from `/api/merchant/stats` via `useEffect` on mount.

## 7.4 Donut Chart — Revenue by Flow

**File:** `client/src/components/merchant/RevenueByFlowChart.tsx`

Use Recharts `<PieChart>` with `<Pie innerRadius={60} outerRadius={90}>`. Data mapped to three cells with explicit `<Cell fill={color} />`: Mocha `#5C3D2E` (authorize), Terracotta `#A0522D` (vault), Sage `#86A873` (invoice). Center label showing total revenue. Custom `<Legend>` below with flow names. Wrapper div with heading "Revenue by Flow".

## 7.5 Line Chart — Bookings Trend

**File:** `client/src/components/merchant/BookingsTrendChart.tsx`

Use Recharts `<LineChart>` with `<Line type="monotone" dataKey="count" stroke="#A0522D" strokeWidth={2} dot={false} />`. X-axis: dates (formatted `MMM d`). Y-axis: booking count. `<CartesianGrid strokeDasharray="3 3" stroke="#E8DFD4" />`. Fill missing dates from the 30-day window with count 0 before passing to chart.

## 7.6 Stacked Bar Chart — Monthly Revenue

**File:** `client/src/components/merchant/MonthlyRevenueChart.tsx`

Use Recharts `<BarChart>` with three stacked `<Bar>` elements: `deposit` (Mocha `#5C3D2E`), `final` (Terracotta `#A0522D`), `addon` (Sage `#86A873`). Each bar has `stackId="revenue"`. X-axis: month labels. Y-axis: dollar amounts. Include `<Tooltip>` with custom formatter showing `$` prefix.

## 7.7 Recent Bookings Table

**File:** `client/src/components/merchant/RecentBookingsTable.tsx`

Fetch last 10 bookings from `GET /api/bookings?limit=10&sort=desc` (add query param support to existing bookings route). Columns: Customer (name), Trip (trip name), Flow (badge: authorize/vault/invoice), Status (colored badge), Amount (`$X,XXX`), Action.

Action column logic:
- Flow 1 + `DEPOSIT_CAPTURED` → `<Link to={/merchant/bookings/:id}>Capture</Link>` (accent button)
- Flow 2 + `ACTIVE`/`IN_PROGRESS` → `<Link>Charge</Link>` (accent button)
- Flow 3 → `<span className="text-text-muted">Waiting</span>` (no action)
- Terminal statuses → `<Link>View</Link>` (ghost button)

## 7.8 Simulation Mode

**File:** `client/src/components/merchant/SimulationPanel.tsx`

Banner at dashboard bottom: `bg-surface-highlight border border-border rounded-xl p-6`. Heading "Simulation Mode" with Lucide `Play` icon. "Start Simulation" button (accent).

On start, steps through a Flow 2 lifecycle with `useRef` for timer and `useState` for current step index:

| Step | Label | Action | Server Call |
|------|-------|--------|-------------|
| 0 | Day 0 — Setup Fee | Create booking + vault + capture $500 | `POST /api/orders/create` + `POST /api/orders/:id/capture` |
| 1 | Day 2 — Spa Treatment | Charge $150 via vault | `POST /api/vault/:vaultId/charge` body `{ description: "Balinese Spa Treatment", amount: 150 }` |
| 2 | Day 3 — Scuba Diving | Charge $200 via vault | `POST /api/vault/:vaultId/charge` body `{ description: "Scuba Diving Session", amount: 200 }` |
| 3 | Day 4 — City Walk | Charge $80 via vault | `POST /api/vault/:vaultId/charge` body `{ description: "Ubud City Walk Guidance", amount: 80 }` |
| 4 | Day 5 — Fire Dance | Charge $120 via vault | `POST /api/vault/:vaultId/charge` body `{ description: "Kecak Fire Dance Event", amount: 120 }` |
| 5 | Day 7 — Final Settlement | Charge $1,450 + delete vault | `POST /api/vault/:vaultId/charge` + `DELETE /api/vault/:vaultId` |

Progress bar showing step X of 6. Each step displays: step label, amount, status indicator (spinner while processing, checkmark on success). Auto-advance via `setTimeout(3000)` or manual "Next Step" button. "Reset" button clears simulation booking from DB via `DELETE /api/bookings/:id/simulation` (new endpoint, restricted to simulation-flagged bookings).

Add server endpoint `POST /api/simulation/seed` to create a Bali booking with a mock vault token (bypasses PayPal for demo purposes — uses a `sim_vault_xxx` token prefix and the vault charge endpoint returns mock captures when it detects the prefix).

## 7.9 Dashboard Page Assembly

**File:** `client/src/pages/merchant/Dashboard.tsx`

Compose all components:

```tsx
export default function Dashboard() {
  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold text-text">Dashboard</h1>
      <StatCards />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RevenueByFlowChart />
        <BookingsTrendChart className="lg:col-span-2" />
      </div>
      <MonthlyRevenueChart />
      <RecentBookingsTable />
      <SimulationPanel />
    </div>
  );
}
```

## 7.10 Commit

```bash
git add server/src/routes/merchant.ts client/src/components/merchant/StatCards.tsx \
  client/src/components/merchant/RevenueByFlowChart.tsx \
  client/src/components/merchant/BookingsTrendChart.tsx \
  client/src/components/merchant/MonthlyRevenueChart.tsx \
  client/src/components/merchant/RecentBookingsTable.tsx \
  client/src/components/merchant/SimulationPanel.tsx \
  client/src/pages/merchant/Dashboard.tsx
git commit -m "feat(dashboard): add merchant dashboard with KPIs, charts, table, and simulation mode"
```
