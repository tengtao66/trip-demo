# Section 8: Polish & Integration Testing

## 8.1 Error Handling — PaymentErrorBanner

Create `client/src/components/payment/PaymentErrorBanner.tsx`:

```tsx
interface PaymentErrorBannerProps {
  error: string | null;
  onDismiss?: () => void;
}

export function PaymentErrorBanner({ error, onDismiss }: PaymentErrorBannerProps) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p className="flex-1">{error}</p>
      {onDismiss && (
        <button onClick={onDismiss} aria-label="Dismiss error">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
```

Wire into all three checkout pages (`client/src/pages/Checkout.tsx`) — render above PayPal buttons. Set error state in `onError` callback and in catch blocks of `createOrder`/`onApprove`. Also add to merchant action dialogs (capture balance, charge add-on, send invoice).

## 8.2 Loading States — Skeleton Screens

Create `client/src/components/ui/Skeleton.tsx` (shadcn/ui skeleton primitive). Add these skeleton variants:

- **TripCardSkeleton** in `client/src/components/trips/TripCardSkeleton.tsx` — pulse gradient matching card dimensions (image block 200px, 3 text lines, badge placeholder).
- **BookingListSkeleton** in `client/src/components/bookings/BookingListSkeleton.tsx` — 4 rows of horizontal bars (reference, trip, status, amount).
- **DashboardChartSkeleton** in `client/src/components/merchant/DashboardChartSkeleton.tsx` — rounded rectangle matching chart container with muted pulse fill.
- **KPICardSkeleton** — row of 4 cards with number placeholder and label bar.

Use in each page's loading state (Zustand loading flag or React Suspense boundaries).

## 8.3 ProcessingOverlay

Create `client/src/components/payment/ProcessingOverlay.tsx`:

```tsx
export function ProcessingOverlay({ message = "Processing payment..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-card p-8 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm font-medium text-text">{message}</p>
      </div>
    </div>
  );
}
```

Show during: `onApprove` server calls (Flow 1 authorize + partial capture, Flow 2 capture + vault extraction), merchant capture/charge actions, and simulation step transitions. Toggle via Zustand `paymentStore.isProcessing`.

## 8.4 End-to-End Testing Checklist (PayPal Sandbox)

Run each flow manually against sandbox credentials. Verify in browser DevTools Network tab and server logs.

| # | Flow | Step | Expected Result |
|---|------|------|-----------------|
| 1 | Auth/Capture | Create order intent=AUTHORIZE | 201 with order ID |
| 2 | Auth/Capture | Approve in PayPal popup | Authorization ID returned |
| 3 | Auth/Capture | Partial capture $200 deposit | Capture ID, booking status DEPOSIT_CAPTURED |
| 4 | Auth/Capture | Merchant captures $600 balance | Status FULLY_CAPTURED, paid_amount = 800 |
| 5 | Vault | Create order with vault attrs | 201 with order ID |
| 6 | Vault | Capture setup fee $500 | vault_token_id saved, status ACTIVE |
| 7 | Vault | Merchant charges add-on $150 | New booking_charge row, capture ID |
| 8 | Vault | Final settlement + vault delete | Status COMPLETED, DELETE returns 204 |
| 9 | Invoice | Submit trip request | trip_requests row created |
| 10 | Invoice | Create + send invoice | PayPal invoice ID saved, email sent |
| 11 | Invoice | Poll invoice status after payment | Status transitions to DEPOSIT_RECEIVED / FULLY_PAID |

## 8.5 Role Switching Verification

Test sequence: login as customer, book Tokyo trip, switch to merchant via nav role switcher, capture balance on dashboard, switch back to customer, confirm booking shows FULLY_CAPTURED.

Verify:
- Nav bar updates immediately (role badge, menu items).
- Customer cannot access `/merchant/*` routes (redirects to `/`).
- Merchant can browse customer routes and also access merchant routes.
- `X-User-Role` header updates on all subsequent API calls after switch.
- localStorage persists role across page refresh.

## 8.6 Responsive Layout

Add Tailwind breakpoints in these files:

- **Trip card grid** (`client/src/pages/Home.tsx`): `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` with consistent gap.
- **Trip detail** (`client/src/pages/TripDetail.tsx`): Stack itinerary and pricing sidebar vertically on mobile (`flex-col lg:flex-row`).
- **Checkout** (`client/src/pages/Checkout.tsx`): Single column below `md`, side-by-side summary + PayPal buttons above.
- **Dashboard charts** (`client/src/pages/merchant/Dashboard.tsx`): `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` for chart cards. KPI cards: `grid-cols-2 md:grid-cols-4`.
- **Booking detail timeline** (`client/src/components/merchant/PaymentTimeline.tsx`): Full-width single column on mobile, two-column layout on `lg`.
- **Nav** (`client/src/components/layout/Header.tsx`): Collapse menu to hamburger below `md`.

Test at 375px (mobile), 768px (tablet), 1280px (desktop).

## 8.7 Edge Cases

**Authorization expiration warning (Flow 1):**
In `client/src/components/merchant/BookingDetail.tsx`, compute days remaining from `authorization_expires_at`. If <= 3 days, show amber warning banner: "Authorization expires in X days. Capture or reauthorize now." If expired, show destructive banner with "Reauthorize" button calling `POST /api/payments/authorizations/:authId/reauthorize`.

**Vault charge failure retry (Flow 2):**
If `POST /api/vault/:vaultId/charge` returns 4xx/5xx, show PaymentErrorBanner with "Charge failed. Check PayPal sandbox status and retry." Add a "Retry" button on the charge dialog that re-submits the same payload. Log failure to `booking_charges` with `status: 'failed'`.

**Empty states:**
- No bookings: `client/src/pages/Bookings.tsx` — illustration placeholder + "No bookings yet. Browse trips to get started." with CTA link to `/`.
- No trip requests: `client/src/pages/merchant/TripRequests.tsx` — "No custom trip requests yet."
- No invoices: `client/src/pages/merchant/Invoices.tsx` — "No invoices created."
- Dashboard with zero data: KPI cards show "0", charts show empty state message instead of blank canvas.

## 8.8 Documentation Update

Update these files after all tasks complete:

- **`docs/context.md`** — Add final tech stack summary, all three payment flows implemented, and key architecture decisions.
- **`docs/todos.md`** — Check off Section 8 tasks (error handling, loading states, responsive, edge cases, E2E testing).
- **`docs/progress.md`** — Append entry: "Section 8 complete — polish pass with error banners, skeletons, ProcessingOverlay, responsive breakpoints, edge case handling, and full E2E sandbox verification."

**Commit:** `feat: add polish layer — error handling, loading states, responsive layout, edge cases`
