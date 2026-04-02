# Section 4: Flow 1 — Authorize & Capture (Tokyo Cherry Blossom)

## 4.1 Checkout Page with PayPalScriptProvider

**File:** `client/src/pages/CheckoutPage.tsx`

Render `PayPalScriptProvider` with `intent: "authorize"` wrapping `PayPalButtons`. The provider options come from the trip's `payment_flow` field so Flow 2 pages can use different options.

```tsx
<PayPalScriptProvider options={{
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
  intent: "authorize",
  currency: "USD",
}}>
  <PayPalButtons createOrder={createOrder} onApprove={onApprove} />
</PayPalScriptProvider>
```

**Checkout UI** shows a two-column layout: left side has trip summary (image, name, dates), right side has the pricing breakdown card:

| Line item | Amount |
|-----------|--------|
| Tokyo Cherry Blossom Express (3 days) | $800.00 |
| Deposit due today | -$200.00 |
| **Balance due within 30 days** | **$600.00** |
| **You pay now** | **$200.00** |

Below the breakdown, render the `PayPalButtons` component. On error, show an inline alert banner (not a modal).

## 4.2 Server: Create Order

**File:** `server/src/routes/orders.ts`

`POST /api/orders/create` — Looks up trip by slug from the request body, calculates the total server-side (never trusts client amounts), and creates a PayPal order with `intent: "AUTHORIZE"`.

```ts
const order = await ordersController.createOrder({
  body: {
    intent: "AUTHORIZE",
    purchaseUnits: [{
      amount: { currencyCode: "USD", value: "800.00" },
      description: "Tokyo Cherry Blossom Express — 3-day tour",
    }],
  },
});
return res.json({ id: order.result.id });
```

The `createOrder` callback on the client returns this order ID to the PayPal SDK.

## 4.3 Server: Authorize + Partial Capture Deposit

**File:** `server/src/routes/orders.ts`

`POST /api/orders/:orderId/authorize` — Called from `onApprove`. Authorizes the full $800, extracts the `authorization_id`, then immediately partial-captures the $200 deposit (`final_capture: false`).

```ts
// Step 1: Authorize the order
const authResponse = await ordersController.authorizeOrder({ id: orderId });
const authId = authResponse.result.purchaseUnits[0]
  .payments.authorizations[0].id;

// Step 2: Partial capture $200 deposit
const captureResponse = await paymentsController.captureAuthorization({
  authorizationId: authId,
  body: {
    amount: { currencyCode: "USD", value: "200.00" },
    finalCapture: false,
  },
});
```

After both succeed, insert into SQLite:
- `bookings` row: status `DEPOSIT_CAPTURED`, `authorization_id`, `authorization_expires_at` (29 days from now), `booking_reference` (e.g., `TERRA-A1B2`)
- `booking_charges` row: type `deposit`, amount 200, status `completed`, `paypal_capture_id`

If the partial capture fails, save with status `DEPOSIT_AUTHORIZED` so the merchant can retry.

Return `{ bookingReference, status, authorizationId, depositCaptureId }` to the client.

## 4.4 Server: Capture Balance

**File:** `server/src/routes/orders.ts`

`POST /api/payments/authorizations/:authId/capture` — Merchant action from the dashboard. Captures the remaining $600 with `final_capture: true`.

```ts
const capture = await paymentsController.captureAuthorization({
  authorizationId: authId,
  body: {
    amount: { currencyCode: "USD", value: "600.00" },
    finalCapture: true,
  },
});
```

Update booking status to `FULLY_CAPTURED`, insert a `booking_charges` row with type `balance`, and set `paid_amount = 800`.

## 4.5 Server: Void Authorization

**File:** `server/src/routes/orders.ts`

`POST /api/payments/authorizations/:authId/void` — Merchant cancels the booking before capturing balance.

```ts
await paymentsController.voidAuthorization({ authorizationId: authId });
```

Update booking status to `VOIDED`. No refund of the deposit capture is performed (captures cannot be voided; a separate refund endpoint would be needed for production).

## 4.6 Client: onApprove and Confirmation

**File:** `client/src/pages/CheckoutPage.tsx`

`onApprove` calls the authorize endpoint, then navigates to the confirmation page:

```tsx
const onApprove = async (data: OnApproveData) => {
  const res = await authFetch(`/api/orders/${data.orderID}/authorize`, { method: "POST" });
  const booking = await res.json();
  navigate(`/bookings/${booking.bookingReference}`);
};
```

**File:** `client/src/pages/BookingConfirmationPage.tsx`

Shows a success state with check icon, booking reference, payment summary (deposit paid, balance pending), and authorization expiration date. Link to "View My Bookings".

## 4.7 Booking Status Model

| Status | Meaning | Transition trigger |
|--------|---------|-------------------|
| `DEPOSIT_AUTHORIZED` | Auth succeeded, partial capture failed | Retry capture or void |
| `DEPOSIT_CAPTURED` | $200 deposit captured, $600 balance pending | Merchant captures balance |
| `FULLY_CAPTURED` | Full $800 captured | Terminal state |
| `VOIDED` | Authorization voided by merchant | Terminal state |
| `EXPIRED` | Authorization expired (29 days) | Background check or manual |

## 4.8 Customer Bookings Pages

**File:** `client/src/pages/BookingsPage.tsx`

`/bookings` — Lists the customer's bookings. Each row shows: booking reference, trip name, status badge (color-coded), amount paid / total, date. Click navigates to detail.

**File:** `client/src/pages/BookingDetailPage.tsx`

`/bookings/:id` — Shows full booking detail: trip info, payment breakdown (deposit captured amount, balance pending/captured), transaction history (list of `booking_charges`), and status timeline. For `DEPOSIT_CAPTURED` status, shows "Balance of $600 will be captured by merchant within 30 days".

**Server routes** (`server/src/routes/bookings.ts`):
- `GET /api/bookings` — Returns bookings for the current user (filtered by `X-User-Role` header)
- `GET /api/bookings/:id` — Returns booking detail with associated charges

## 4.9 Commit Checkpoint

After completing and verifying all tasks in this section:

```bash
git add client/src/pages/CheckoutPage.tsx \
       client/src/pages/BookingConfirmationPage.tsx \
       client/src/pages/BookingsPage.tsx \
       client/src/pages/BookingDetailPage.tsx \
       server/src/routes/orders.ts \
       server/src/routes/bookings.ts
git commit -m "feat: implement Flow 1 authorize & capture (Tokyo Cherry Blossom)"
```
