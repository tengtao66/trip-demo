# Section 5: Flow 2 — Vaulting (Bali Adventure Retreat)

> Vault-with-purchase, merchant-initiated subsequent charges, vault deletion, and the booking detail timeline view.

**Booking statuses:** `ACTIVE` (setup fee captured) -> `IN_PROGRESS` (add-on charges started) -> `COMPLETED` (final settlement + vault deleted)

---

## Task 5.1 — Checkout Page for Flow 2

**File:** `client/src/pages/CheckoutVaultPage.tsx`

Render `PayPalScriptProvider` with vault-specific options and the checkout UI.

```tsx
<PayPalScriptProvider options={{
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
  intent: "capture",
  vault: true,
  currency: "USD",
}}>
  <PayPalButtons createOrder={createOrder} onApprove={onApprove} />
</PayPalScriptProvider>
```

**UI elements:**
- Trip summary card (Bali Adventure Retreat, 7 days)
- Pricing breakdown: Setup Fee $500 (charged now), Base Price $2,500 (total), add-on info text explaining merchant-initiated charges during trip
- PayPal Buttons rendered below the breakdown
- On approve: call `POST /api/orders/:orderId/capture`, redirect to `/bookings/:id`

**Route:** Register `/checkout/bali-adventure` in `App.tsx` pointing to this page.

---

## Task 5.2 — Server: Create Order with Vault Attributes

**File:** `server/src/routes/orders.ts` (extend existing route)

Add vault-aware logic to `POST /api/orders/create`. When the trip's `payment_flow === 'vault'`, build the order body with vault attributes:

```ts
const orderBody = {
  intent: "CAPTURE",
  purchase_units: [{
    amount: { currency_code: "USD", value: "500.00" },
    description: "Bali Adventure Retreat - Setup Fee",
  }],
  payment_source: {
    paypal: {
      attributes: {
        vault: {
          store_in_vault: "ON_SUCCESS",
          usage_type: "MERCHANT",
          usage_pattern: "UNSCHEDULED_POSTPAID",
        },
      },
      experience_context: {
        return_url: `${baseUrl}/checkout/bali-adventure?status=approved`,
        cancel_url: `${baseUrl}/checkout/bali-adventure?status=cancelled`,
      },
    },
  },
};
```

Call `ordersController.ordersCreate({ body: orderBody })` and return the order ID to the client.

---

## Task 5.3 — Server: Capture Order & Extract Vault Token

**File:** `server/src/routes/orders.ts`

In `POST /api/orders/:orderId/capture`, after calling `ordersController.ordersCapture({ id: orderId })`:

1. Extract `vault_id` from `response.result.payment_source.paypal.attributes.vault.id`
2. Extract `capture_id` from `response.result.purchase_units[0].payments.captures[0].id`
3. Insert booking into SQLite with `status = 'ACTIVE'`, `vault_token_id = vault_id`, `paid_amount = 500`
4. Insert a `booking_charges` row: `type = 'setup_fee'`, `amount = 500`, `status = 'completed'`
5. Return `{ bookingId, bookingReference, vaultTokenId }` to client

---

## Task 5.4 — Server: Merchant-Initiated Charge via Vault

**File:** `server/src/routes/vault.ts` (new file)

`POST /api/vault/:vaultId/charge`

Request body: `{ bookingId, amount, description }`

```ts
const orderBody = {
  intent: "CAPTURE",
  purchase_units: [{
    amount: { currency_code: "USD", value: amount.toFixed(2) },
    description,
  }],
  payment_source: {
    paypal: {
      vault_id: req.params.vaultId,
    },
  },
};
```

1. Create order with `ordersController.ordersCreate({ body: orderBody })`
2. Immediately capture with `ordersController.ordersCapture({ id: orderId })`
3. Insert `booking_charges` row: `type = 'addon'`, `status = 'completed'`
4. Update `bookings.paid_amount += amount`; if first add-on, set `status = 'IN_PROGRESS'`
5. Return charge record to client

---

## Task 5.5 — Server: Delete Vault Token

**File:** `server/src/routes/vault.ts`

`DELETE /api/vault/:vaultId`

Call PayPal API directly: `DELETE /v3/vault/payment-tokens/:vaultId` using the SDK's HTTP client or a raw fetch with OAuth token from `server/src/services/paypal.ts`.

After success, set `bookings.vault_token_id = NULL` for the associated booking. Return `{ deleted: true }`.

---

## Task 5.6 — Merchant Booking Detail Page with Payment Timeline

**File:** `client/src/pages/MerchantBookingDetailPage.tsx`

**Two-column layout:**

*Left column — Booking Info:*
- Customer card (name, email, booking date)
- Payment summary: setup fee + add-ons + final settlement = total, with progress bar (paid / total)
- Action buttons: "Charge Add-on" (primary), "Final Settlement" (secondary), "Delete Vault" (destructive, only after COMPLETED)

*Right column — Payment Timeline:*

Vertical timeline component (`client/src/components/merchant/PaymentTimeline.tsx`) fed by `GET /api/bookings/:id/charges`. Each entry:

```
[circle indicator]
  Charge Name (e.g., "Balinese Spa Treatment")
  Type: Activity add-on - Merchant-initiated
  Apr 6, 2026 - 2:15 PM (Day 2)        $150.00  [CAPTURED badge]
```

- Completed charges: solid sage-green left border, green CAPTURED badge
- Pending final settlement: dashed amber border, amber PENDING badge
- Day indicator calculated from booking start date

**Server route:** `GET /api/bookings/:id/charges` in `server/src/routes/bookings.ts` — returns ordered charges with computed `trip_day` field.

---

## Task 5.7 — Charge Add-on Dialog & Final Settlement

**File:** `client/src/components/merchant/ChargeAddonDialog.tsx`

shadcn/ui Dialog with:
- Dropdown: predefined add-ons (Spa $150, Scuba $200, Cooking $80, Volcano trek $120) or "Custom" with manual amount/description
- Amount field (pre-filled from selection, editable for custom)
- Description field
- "Charge" button calls `POST /api/vault/:vaultId/charge`
- On success: toast notification, refresh timeline, update payment summary

**Final Settlement action** (`client/src/components/merchant/FinalSettlementButton.tsx`):
1. Calculate remaining balance: `total_amount - paid_amount`
2. Confirm dialog: "Charge final settlement of $X,XXX.XX?"
3. Call `POST /api/vault/:vaultId/charge` with `type = 'final'`
4. On success: call `DELETE /api/vault/:vaultId` to clean up vault token
5. Update booking status to `COMPLETED`

---

## Task 5.8 — Wire Up & Commit

1. Register vault routes in `server/src/index.ts`: `app.use('/api/vault', vaultRouter)`
2. Add charges route: `GET /api/bookings/:id/charges` to bookings router
3. Register `CheckoutVaultPage` route in `App.tsx`
4. Add "Bali Adventure" card on Home page linking to `/checkout/bali-adventure`
5. Verify end-to-end: customer checkout -> merchant charges add-on -> final settlement -> vault deleted

**Commit:** `feat(flow2): implement vault payment flow with merchant-initiated charges and timeline`
