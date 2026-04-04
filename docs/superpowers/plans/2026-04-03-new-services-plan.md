# New Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Car Rental (instant capture + Pay Later) and Cruise Trip (authorize & capture) services to the TERRA trip booking demo.

**Architecture:** Extend existing schema with `category`, `daily_rate`, `pickup_date`, `dropoff_date` columns, add `instant` payment_flow and `full_payment` charge type. Extract shared constants first. Car rental gets a new checkout page with standalone PayPal/Pay Later buttons + PayPalMessages. Cruises reuse the existing authorize flow entirely — only seed data and image mapping needed.

**Tech Stack:** React 19, Vite, Tailwind v4, shadcn/ui, Express v5, SQLite, PayPal JS SDK v5 (react-paypal-js v8.x), PayPal Pay Later messaging

**Spec:** `docs/superpowers/specs/2026-04-03-new-services-design.md`

---

## Section 1: Extract Shared Constants (Prerequisite)

**Files:**
- Create: `client/src/lib/constants.ts`
- Modify: `TripCard.tsx`, `TripDetailPage.tsx`, `BookingsPage.tsx`, `BookingDetailPage.tsx`, `CheckoutAuthorizePage.tsx`, `CheckoutVaultPage.tsx`, `MerchantBookingsPage.tsx`

### Task 1.1: Create `client/src/lib/constants.ts`

- [ ] Create `client/src/lib/constants.ts` with the complete `tripImages` record (all 9 slugs) and merged `STATUS_LABELS` record:

```typescript
// Shared image map — slug → public asset path
export const tripImages: Record<string, string> = {
  // Tours (existing)
  "tokyo-cherry-blossom": "/tokyo.webp",
  "bali-adventure": "/bali2.webp",
  "custom-european-tour": "/euro2.jpg",
  // Car Rentals (new)
  "economy-sedan": "/car-rental-car.webp",
  "suv-rental": "/car-rental-suv.webp",
  "luxury-convertible": "/car-rental-luxury.jpg",
  // Cruises (new)
  "caribbean-cruise": "/cruises-caribbean.webp",
  "mediterranean-cruise": "/cruises-mediterranean.webp",
  "alaska-cruise": "/cruise-alaska.webp",
};

// Shared booking status display config
export const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  REQUEST_SUBMITTED: { label: "Request Submitted", className: "bg-purple-100 text-purple-800" },
  INVOICE_CREATED:   { label: "Invoice Created",   className: "bg-blue-100 text-blue-800" },
  AWAITING_DEPOSIT:  { label: "Awaiting Deposit",  className: "bg-amber-100 text-amber-800" },
  DEPOSIT_RECEIVED:  { label: "Deposit Received",  className: "bg-blue-100 text-blue-800" },
  DEPOSIT_AUTHORIZED:{ label: "Authorized",        className: "bg-amber-100 text-amber-800" },
  DEPOSIT_CAPTURED:  { label: "Deposit Paid",      className: "bg-amber-100 text-amber-800" },
  FULLY_CAPTURED:    { label: "Fully Paid",        className: "bg-green-100 text-green-800" },
  FULLY_PAID:        { label: "Fully Paid",        className: "bg-green-100 text-green-800" },
  SETUP_FEE_PAID:    { label: "Active",            className: "bg-blue-100 text-blue-800" },
  ACTIVE:            { label: "Active",            className: "bg-blue-100 text-blue-800" },
  IN_PROGRESS:       { label: "In Progress",       className: "bg-blue-100 text-blue-800" },
  INVOICE_SENT:      { label: "Invoice Sent",      className: "bg-purple-100 text-purple-800" },
  INVOICE_PAID:      { label: "Invoice Paid",      className: "bg-green-100 text-green-800" },
  CONFIRMED:         { label: "Confirmed",         className: "bg-green-100 text-green-800" },
  COMPLETED:         { label: "Completed",         className: "bg-green-100 text-green-800" },
  VOIDED:            { label: "Cancelled",         className: "bg-red-100 text-red-800" },
};
```

- [ ] Verify: `cd /Users/tteng/Development/AI/trip-demo && npx tsc --noEmit -p client/tsconfig.json 2>&1 | head -20`
- [ ] Commit: `git add client/src/lib/constants.ts && git commit -m "feat: add shared constants module (tripImages, STATUS_LABELS)"`

### Task 1.2: Update `TripCard.tsx`

- [ ] Replace local `tripImages` (lines 7–11) with `import { tripImages } from "@/lib/constants";`
- [ ] Delete the local `const tripImages` block
- [ ] Verify + commit

### Task 1.3: Update `TripDetailPage.tsx`

- [ ] Add `import { tripImages } from "@/lib/constants";`
- [ ] Delete the local `const tripImages` block
- [ ] Verify + commit

### Task 1.4: Update `BookingsPage.tsx`

- [ ] Replace local `tripImages` and `STATUS_LABELS` with `import { tripImages, STATUS_LABELS } from "@/lib/constants";`
- [ ] Delete both local const blocks
- [ ] Verify + commit

### Task 1.5: Update `BookingDetailPage.tsx`

- [ ] Replace local `tripImages` and `STATUS_LABELS` with import from `@/lib/constants`
- [ ] Delete both local const blocks
- [ ] Verify + commit

### Task 1.6: Update `CheckoutAuthorizePage.tsx`

- [ ] Replace local `tripImages` with import from `@/lib/constants`
- [ ] Delete the local const block
- [ ] Verify + commit

### Task 1.7: Update `CheckoutVaultPage.tsx`

- [ ] Replace local `tripImages` with import from `@/lib/constants`
- [ ] Delete the local const block
- [ ] Verify + commit

### Task 1.8: Update `MerchantBookingsPage.tsx`

- [ ] Replace local `STATUS_LABELS` with `import { STATUS_LABELS } from "@/lib/constants";`
- [ ] Delete the local const block
- [ ] Verify + commit

### Task 1.9: Full build smoke test

- [ ] Run: `npx tsc --noEmit -p client/tsconfig.json`
- [ ] Start dev server, confirm homepage loads without console errors
- [ ] Commit if any remaining changes

---

## Section 2: Schema & Seed Data

**Files:**
- Modify: `server/src/db/schema.sql`, `server/src/db/seed.sql`, `client/src/types/trip.ts`, server Trip type

### Task 2.1: Update `schema.sql` — trips table

- [ ] Add two new columns after `image_gradient` in `CREATE TABLE trips`:
  ```sql
  category TEXT NOT NULL DEFAULT 'tour',
  daily_rate REAL
  ```
- [ ] Update payment_flow CHECK constraint:
  ```sql
  payment_flow TEXT NOT NULL CHECK(payment_flow IN ('authorize','vault','invoice','instant')),
  ```
- [ ] Commit: `git commit -m "feat(schema): add category, daily_rate columns and instant payment_flow"`

### Task 2.2: Update `schema.sql` — bookings table

- [ ] Add `pickup_date` and `dropoff_date` columns to `CREATE TABLE bookings`:
  ```sql
  pickup_date TEXT,
  dropoff_date TEXT,
  ```
- [ ] Commit

### Task 2.3: Update `schema.sql` — booking_charges table

- [ ] Update the `type` CHECK constraint to include `'full_payment'`:
  ```sql
  type TEXT NOT NULL CHECK(type IN ('deposit','balance','addon','setup_fee','final','full_payment')),
  ```
- [ ] Commit

### Task 2.4: Update `seed.sql` — existing trips

- [ ] Update the existing INSERT column list to include `category, daily_rate`
- [ ] Add `'tour', NULL` to each of the existing 3 tour rows
- [ ] Commit

### Task 2.5: Update `seed.sql` — 3 car rental records

- [ ] Add car rental INSERT with itinerary `'[]'`, `category = 'car_rental'`, `daily_rate = 50/100/150`, `deposit_amount = 0`, `duration_days = 0`:

```sql
INSERT OR IGNORE INTO trips (id, slug, name, description, duration_days, base_price, deposit_amount, payment_flow, itinerary, image_gradient, category, daily_rate) VALUES
  ('t-car-01', 'economy-sedan', 'Economy Sedan', 'Compact and fuel-efficient — perfect for city driving and airport runs.', 0, 50, 0, 'instant',
   '[]', 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)', 'car_rental', 50),
  ('t-car-02', 'suv-rental', 'SUV', 'Spacious SUV with all-wheel drive — ideal for families and road trips.', 0, 100, 0, 'instant',
   '[]', 'linear-gradient(135deg, #6b7280 0%, #1f2937 100%)', 'car_rental', 100),
  ('t-car-03', 'luxury-convertible', 'Luxury Convertible', 'Turn heads in our premium convertible — the ultimate open-road experience.', 0, 150, 0, 'instant',
   '[]', 'linear-gradient(135deg, #d97706 0%, #92400e 100%)', 'car_rental', 150);
```

- [ ] Commit

### Task 2.6: Update `seed.sql` — 3 cruise records

- [ ] Add cruise INSERT with full itinerary JSON from spec, `category = 'cruise'`, `daily_rate = NULL`, `payment_flow = 'authorize'`. Remember to escape apostrophes as `''` in SQL strings (Dunn's → Dunn''s, Captain's → Captain''s).
- [ ] Commit

### Task 2.7: Update Trip type interfaces

- [ ] Update `client/src/types/trip.ts`:
  ```typescript
  payment_flow: "authorize" | "vault" | "invoice" | "instant";
  category: "tour" | "car_rental" | "cruise";
  daily_rate: number | null;
  ```
- [ ] Check `server/src/types/trip.ts` — if it exists, add the same fields + `"instant"` to payment_flow
- [ ] Commit

### Task 2.8: Delete and rebuild SQLite database

- [ ] Delete the existing DB file (check `server/src/db/` or `server/` for `.db` files)
- [ ] Start the server to trigger schema creation + seeding
- [ ] Verify: `sqlite3 <db-path> "SELECT slug, category, daily_rate, payment_flow FROM trips;"` — expect 9 rows
- [ ] Commit if any incidental changes

---

## Section 3: Homepage Tabbed Layout

**Files:**
- Modify: `client/src/pages/HomePage.tsx`, `client/src/components/trips/TripCard.tsx`
- Possibly install: shadcn `Tabs` component

### Task 3.1: Install shadcn Tabs component

- [ ] Check if already present: `ls client/src/components/ui/tabs.tsx`
- [ ] If missing: `cd client && npx shadcn@latest add tabs --yes`
- [ ] Commit if new file added

### Task 3.2: Update `flowBadge` in TripCard for `instant`

- [ ] Add `instant` entry to `flowBadge` record:
  ```typescript
  instant: {
    label: "Pay Later Available",
    className: "bg-blue-600 text-white",
  },
  ```
- [ ] Commit

### Task 3.3: Add category-specific display to TripCard

- [ ] Hide duration badge when `trip.duration_days === 0`:
  ```tsx
  {trip.duration_days > 0 && (
    <span className="..."><Clock ... />{trip.duration_days} ...</span>
  )}
  ```
- [ ] Replace the pricing `<p>` with category-specific display:
  - `car_rental`: `From $X/day`
  - `cruise`: `$X` + small `Deposit: $Y` below
  - `tour`: existing `$X` (unchanged)
- [ ] Update CTA button text per category (currently all say "Book Now" via the Link):
  - `car_rental`: "Rent Now"
  - `cruise`: "Reserve Now"
  - `tour`: keep existing behavior (varies by flow)
- [ ] Commit

### Task 3.4: Rewrite `HomePage.tsx` with tabbed layout

- [ ] Replace HomePage with shadcn `Tabs` (Tours | Car Rentals | Cruises)
- [ ] Use `useSearchParams` for `?tab=tour|car_rental|cruise` deep linking, default `tour`
- [ ] Filter trips client-side by `trip.category === activeTab`
- [ ] Update hero text: "Explore Our Services" / "Tours, car rentals, and cruises"
- [ ] Commit

### Task 3.5: Smoke test

- [ ] Navigate to `/` — Tours tab active by default, shows 3 tour cards
- [ ] Click "Car Rentals" — URL updates to `?tab=car_rental`, 3 car cards with "/day" pricing
- [ ] Click "Cruises" — 3 cruise cards with deposit line
- [ ] Direct URL `/?tab=cruise` pre-selects Cruises tab

---

## Section 4: Car Rental Detail Page

**Files:**
- Create: `client/src/components/PayLaterMessage.tsx`
- Modify: `client/src/pages/TripDetailPage.tsx`

### Task 4.1: Create `PayLaterMessage.tsx`

- [ ] Create reusable component wrapping `PayPalScriptProvider` (messages-only) + `PayPalMessages`:

```tsx
import { PayPalScriptProvider, PayPalMessages } from "@paypal/react-paypal-js";

interface PayLaterMessageProps {
  amount: number;
  placement?: "product" | "payment" | "cart" | "home";
}

const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID as string;

export default function PayLaterMessage({ amount, placement = "product" }: PayLaterMessageProps) {
  if (!amount || amount <= 0) return null;
  return (
    <PayPalScriptProvider options={{
      "client-id": clientId,
      currency: "USD",
      components: "messages",
      "buyer-country": "US",
    }}>
      <PayPalMessages
        style={{ layout: "text", logo: { type: "inline" }, text: { color: "black", size: "12" } }}
        amount={amount}
        placement={placement}
      />
    </PayPalScriptProvider>
  );
}
```

- [ ] Verify + commit

### Task 4.2: Add date picker state and calculation to TripDetailPage

- [ ] Add imports: `useNavigate`, `PayLaterMessage`
- [ ] Add state: `pickupDate`, `dropoffDate`, derived `rentalDays` and `rentalTotal`
- [ ] Commit

### Task 4.3: Add car rental branch to TripDetailPage sidebar

- [ ] Gate existing "Book Now" / "Design Your Trip" CTA behind `trip.payment_flow !== "instant"`
- [ ] Add `instant` branch with:
  - Pickup date input (`type="date"`, min = today)
  - Dropoff date input (min = pickupDate)
  - Live calculation: `$X/day × N days = $Total`
  - `PayLaterMessage` with calculated total
  - "Book Now" button (disabled until dates valid), calls `navigate('/checkout/${slug}', { state: { pickupDate, dropoffDate } })`
- [ ] Commit

### Task 4.4: Hide duration badge for car rentals

- [ ] Wrap duration display in `{trip.duration_days > 0 && (...)}`
- [ ] Commit

### Task 4.5: Manual test

- [ ] Car detail page: select dates, confirm total calculation + PayLaterMessage renders
- [ ] "Book Now" navigates to `/checkout/economy-sedan` (will 404 until Section 5 — expected)

---

## Section 5: Car Rental Checkout (CheckoutInstantPage)

**Files:**
- Create: `client/src/pages/checkout/CheckoutInstantPage.tsx`
- Modify: `client/src/pages/CheckoutPage.tsx`

### Task 5.1: Create `CheckoutInstantPage.tsx`

- [ ] Create the file with:
  - Props: `{ trip: Trip }`
  - Read `pickupDate`, `dropoffDate` from `useLocation().state`
  - Guard: if dates missing, show fallback message
  - Derive `rentalDays`, `dailyRate`, `totalPrice`
  - Two-column layout: left = order summary card (photo via `tripImages`, dates, rate × days), right = payment section
  - Own `PayPalScriptProvider` with `"client-id"`, `intent: "capture"`, `components: "buttons,messages"`, `"enable-funding": "paylater"`, `"buyer-country": "US"`
  - Stacked buttons:
    1. `PayPalButtons fundingSource={FUNDING.PAYPAL}` (yellow)
    2. `PayPalButtons fundingSource={FUNDING.PAYLATER}` (blue)
  - `PayPalMessages` under Pay Later button (`placement="payment"`)
  - `createOrder` → POST `/api/orders/create` with `{ slug, pickupDate, dropoffDate }`
  - `onApprove` → POST `/api/orders/${orderID}/capture` → navigate to booking
  - Error state + error banner
- [ ] Verify TypeScript
- [ ] Commit

### Task 5.2: Wire into CheckoutPage dispatcher

- [ ] Add import: `import CheckoutInstantPage from "./checkout/CheckoutInstantPage";`
- [ ] Add case in switch:
  ```tsx
  case "instant":
    return <CheckoutInstantPage trip={trip} />;
  ```
- [ ] Verify + commit

### Task 5.3: Smoke test (UI only — server not ready yet)

- [ ] Navigate from car detail → checkout, confirm page renders with dates, buttons, and messages
- [ ] PayPal buttons may fail (server endpoint not ready) — that's expected for now

---

## Section 6: Server-Side Instant Capture

**Files:**
- Modify: `server/src/routes/orders.ts`

### Task 6.1: Add date validation helper

- [ ] Add `validateRentalDates` function at top of `orders.ts`:
  - Validates `pickupDate` and `dropoffDate` are strings, valid dates
  - Ensures `dropoff > pickup`
  - Ensures rental period <= 90 days
  - Returns `{ days: number }`
- [ ] Commit

### Task 6.2: Add `instant` branch in POST /orders/create

- [ ] Between the `vault` and `authorize` branches, add `else if (trip.payment_flow === "instant")`:
  - Validate dates via `validateRentalDates`
  - Calculate `totalAmount = dailyRate × days`
  - Create PayPal order with `CheckoutPaymentIntent.Capture`, store dates in `customId`
  - Return `{ id: result.id }`
- [ ] Verify + commit

### Task 6.3: Handle `instant` flow in POST /orders/:orderId/capture

- [ ] At the start of the capture handler, before the vault REST call:
  - Get order details via `ordersController.getOrder`
  - Look up trip by `referenceId`
  - If `trip.payment_flow === "instant"`:
    - Capture via `ordersController.captureOrder`
    - Verify status === "COMPLETED"
    - Parse rental dates from `customId`
    - Save booking with status `CONFIRMED`, `paid_amount = total_amount`, `pickup_date`, `dropoff_date`
    - Save charge record with type `full_payment`
    - Return `{ bookingId, bookingReference }`
    - `return` early (skip vault logic)
- [ ] Verify + commit

### Task 6.4: End-to-end test

- [ ] Complete a car rental checkout in sandbox
- [ ] Verify booking created with status CONFIRMED
- [ ] Verify charge record has type `full_payment`
- [ ] Test date validation: missing dates → 400, dropoff before pickup → 400, > 90 days → 400

---

## Section 7: Cruise Integration Verification

No new files — verification and edge case fixes only.

### Task 7.1: Verify cruises render on homepage

- [ ] Click Cruises tab — 3 cruise cards appear with correct images, prices, and deposit amounts
- [ ] If images broken, verify `tripImages` has correct mappings

### Task 7.2: Verify cruise detail page

- [ ] Open each cruise detail page
- [ ] Confirm itinerary timeline renders all days
- [ ] Confirm hero image loads
- [ ] Confirm duration badge shows (e.g., "7 Days")
- [ ] Confirm no date picker appears (only for `car_rental`)

### Task 7.3: Verify cruise checkout (authorize flow)

- [ ] Click "Reserve Now" on Caribbean cruise → confirm `CheckoutAuthorizePage` renders
- [ ] Confirm deposit shows $700, balance shows $2,100
- [ ] Complete sandbox checkout → verify booking with status `DEPOSIT_CAPTURED`

### Task 7.4: Verify merchant can capture cruise balance

- [ ] Log in as merchant, find cruise booking
- [ ] Confirm "Capture Balance" button shows $2,100
- [ ] Click capture → status updates to `FULLY_CAPTURED`

---

## Section 8: Booking Detail & Merchant Dashboard Updates

**Files:**
- Potentially modify: `client/src/pages/BookingDetailPage.tsx`, `server/src/routes/merchant.ts`, `client/src/pages/merchant/MerchantBookingDetailPage.tsx`

### Task 8.1: Verify CONFIRMED status in customer BookingsPage

- [ ] After a car rental checkout, navigate to `/bookings`
- [ ] Confirm booking shows green "Confirmed" badge (from STATUS_LABELS)
- [ ] Confirm car image renders correctly

### Task 8.2: Update BookingDetailPage confirmation banner

- [ ] For CONFIRMED bookings, the banner should say "Payment complete" instead of "Your deposit has been captured":
  ```tsx
  {booking.status === "CONFIRMED"
    ? "Payment complete. "
    : "Your deposit has been captured. "}
  ```
- [ ] Commit

### Task 8.3: Update merchant TERMINAL_STATUSES

- [ ] In `server/src/routes/merchant.ts`, add `"CONFIRMED"` to terminal statuses array so car rental bookings don't count as "active":
  ```ts
  const TERMINAL_STATUSES = ["COMPLETED", "CONFIRMED", "FULLY_CAPTURED", "FULLY_PAID", "VOIDED", "EXPIRED"];
  ```
- [ ] Commit

### Task 8.4: Handle `instant` in MerchantBookingDetailPage

- [ ] Add `"instant"` case to the payment_flow switch in `MerchantBookingDetailPage.tsx`
- [ ] For instant bookings, show a simple read-only detail view (no capture/void actions — already fully paid)
- [ ] Commit

### Task 8.5: Full round-trip smoke test (all 5 flows)

- [ ] Tour (authorize): Tokyo → checkout → deposit captured → merchant captures balance
- [ ] Tour (vault): Bali → checkout → active
- [ ] Tour (invoice): European → trip request → invoice sent
- [ ] Car rental (instant): Economy Sedan → dates → checkout → confirmed
- [ ] Cruise (authorize): Caribbean → checkout → deposit captured → merchant captures balance
- [ ] Run `npx tsc --noEmit` on both client and server — 0 errors

---

## Section 8.6: PayPal SDK Intent Pre-loading (Optimization)

**Files:**
- Create: `client/src/lib/use-paypal-intent.ts`
- Modify: `client/src/App.tsx`, `client/src/pages/HomePage.tsx`, `client/src/pages/TripDetailPage.tsx`
- Modify: `client/src/pages/checkout/CheckoutInstantPage.tsx`, `client/src/pages/checkout/CheckoutAuthorizePage.tsx`, `client/src/pages/checkout/CheckoutVaultPage.tsx`

**Problem:** With per-page `PayPalScriptProvider` instances, multiple SDK loads caused `zoid destroyed all components` errors. With a single global provider, checkout pages need to switch `intent` (capture vs authorize) via `resetOptions`, which triggers a re-render and button flash/remount on the checkout page.

**Solution:** Pre-load the correct SDK intent **before** the user reaches checkout, so buttons render instantly.

### Task 8.6.1: Single global PayPalScriptProvider

- [x] Move `PayPalScriptProvider` to `App.tsx` with default `intent: "capture"`
- [x] Remove per-page providers from all checkout pages
- [x] Commit

### Task 8.6.2: Create `usePayPalIntent` hook

- [x] Create `client/src/lib/use-paypal-intent.ts`:
  - Compares current `options.intent` against requested intent
  - Only calls `resetOptions` when they differ (prevents unnecessary SDK reloads)
- [x] Commit

### Task 8.6.3: Pre-load intent on HomePage tabs

- [x] In `HomePage.tsx`, call `usePayPalIntent` based on active tab:
  - `cruise` tab → `"authorize"`
  - `tour` / `car_rental` tabs → `"capture"`
- [x] SDK switches intent in background as user browses tabs
- [x] Commit

### Task 8.6.4: Pre-load intent on TripDetailPage

- [x] In `PricingSidebar` component, call `usePayPalIntent` based on `trip.payment_flow`:
  - `"authorize"` → `"authorize"`
  - All others → `"capture"`
- [x] SDK switches intent while user reads trip details, before clicking checkout button
- [x] Commit

### Task 8.6.5: Keep checkout page hooks as safety nets

- [x] Each checkout page still calls `usePayPalIntent` (capture or authorize) as a fallback
  - `CheckoutInstantPage` → `usePayPalIntent("capture")`
  - `CheckoutAuthorizePage` → `usePayPalIntent("authorize")`
  - `CheckoutVaultPage` → `usePayPalIntent("capture")`
- [x] With pre-loading, these are typically no-ops (intent already matches)
- [x] Commit

**Result:** Buttons render on first paint with correct intent. No extra render cycle, no flash.

---

## Section 9: UX Polish (from UI/UX Review)

**Ref:** Spec section "UX Improvements (from UI/UX Review)"
**Mockups:** `docs/ui/car-rental-*.html`, `docs/ui/cruise-*.html`, `docs/ui/booking-detail-*.html`

### Task 9.1: Fix muted text contrast (global)

- [ ] In `client/src/index.css`, update the muted foreground CSS variable from `#8a7e74` to `#5e5549` (WCAG AA 5.5:1 on Alpine Oat)
- [ ] Verify across all pages — text should be more readable without changing the visual style
- [ ] Commit

### Task 9.2: Add focus-visible styles (global)

- [ ] In `client/src/index.css`, add global focus-visible rule:
  ```css
  :focus-visible {
    outline: 2px solid hsl(var(--primary));
    outline-offset: 2px;
  }
  ```
- [ ] Increase date input focus ring opacity from `0.1` to `0.25` in TripDetailPage car rental section
- [ ] Commit

### Task 9.3: Car rental date validation

- [ ] In TripDetailPage, add validation: pickup min = today, dropoff min = pickup + 1 day
- [ ] Show inline error text (red, 12px) if dropoff <= pickup: "Dropoff must be after pickup date"
- [ ] Show hint text below dropoff input: "Minimum 1-day rental"
- [ ] Disable "Book Now" button when dates are invalid
- [ ] Commit

### Task 9.4: Car rental pricing display fixes

- [ ] In TripDetailPage sidebar, show subtotal on the "$X/day x N days" calc row (right side)
- [ ] Add brief CSS transition/pulse on total when it recalculates after date change
- [ ] Use Terracotta badge with "CAR RENTAL" label in hero (not PayPal blue "PAY LATER")
- [ ] Commit

### Task 9.5: Car rental checkout cancellation policy

- [ ] In CheckoutInstantPage, add green banner below PayPal Messages:
  ```tsx
  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
    <CheckCircle2 className="h-4 w-4" />
    Free cancellation up to 24 hours before pickup
  </div>
  ```
- [ ] Commit

### Task 9.6: Cruise customer-facing copy fixes

- [ ] In TripDetailPage cruise sidebar, change "Balance due" to "Balance due later"
- [ ] Remove "29-day authorization window" from customer-facing text, replace with "charged before departure"
- [ ] In CheckoutAuthorizePage, update auth explanation to remove "29-day" reference for customer view
- [ ] Commit

### Task 9.7: Cruise checkout Pay Later note

- [ ] In CheckoutAuthorizePage (or cruise-specific section), add italic note below PayPal button:
  ```tsx
  <p className="text-xs text-muted-foreground italic mt-2">
    Pay Later is not available for deposit-based bookings.
  </p>
  ```
- [ ] Commit

### Task 9.8: Car rental booking detail — rental details section

- [ ] In BookingDetailPage, add "Rental Details" section when `payment_flow === "instant"` and `pickup_date` exists:
  - Pickup date, dropoff date, daily rate, duration
- [ ] Show "Payment Complete" box in sidebar (green, no remaining balance)
- [ ] Commit

### Task 9.9: Cruise booking detail — authorization progress bar

- [ ] In BookingDetailPage, add horizontal progress bar showing position in 29-day auth window when `payment_flow === "authorize"` and `status === "DEPOSIT_CAPTURED"`
- [ ] Calculate days elapsed from `created_at`, show "Day X of 29" with expiry date
- [ ] Add pulse animation on current position indicator
- [ ] Commit

### Task 9.10: Replace emoji with Lucide icons

- [ ] Across all new pages (TripCard, TripDetailPage, CheckoutInstantPage, BookingDetailPage), replace emoji characters with Lucide React icons (Car, Ship, Calendar, Shield, etc.)
- [ ] Ensure all icons have proper `aria-hidden="true"` when decorative, or `aria-label` when meaningful
- [ ] Commit

### Task 9.11: Trust badge size fix

- [ ] Increase trust badge text from 11px to 12px across detail and checkout pages
- [ ] Commit

### Task 9.12: Mobile responsive breakpoints

- [ ] Add Tailwind responsive classes to all new pages:
  - Hero: `grid-cols-1 md:grid-cols-2`
  - Main content: `grid-cols-1 lg:grid-cols-[1fr_380px]`
  - Specs grid: `grid-cols-2 md:grid-cols-4`
  - Features/highlights: `grid-cols-1 md:grid-cols-2`
- [ ] Verify on 375px viewport — no horizontal scroll, sidebar stacks below
- [ ] Commit

---

## Section 10: Additional Polish (2026-04-04)

### Task 10.1: Car rental checkout — "or" divider between payment buttons

- [x] Add `── or ──` text divider between PayPal and Pay Later buttons in `CheckoutInstantPage.tsx`
- [x] Use `flex items-center` with two `border-t` lines and centered `text-xs text-muted-foreground` "or" text
- [x] Commit

### Task 10.2: Pay Later message grouping

- [x] Wrap Pay Later button + `PayLaterMessages` component in a `space-y-2` container
- [x] Center-align the message with `text-center`
- [x] Remove duplicate "Free cancellation" green banner (already in What's Included)
- [x] Remove unused `CheckCircle2` import
- [x] Commit

### Task 10.3: Payment section fieldset legend

- [x] Replace `<div>` + `<p>` with `<fieldset>` + `<legend>` for the payment section in `CheckoutInstantPage.tsx`
- [x] Legend: `mx-auto px-3 text-sm font-semibold text-foreground` — centered on top border with gap
- [x] Commit

### Task 10.4: Header logo change

- [x] Change header logo text from "TERRA" to "MERCHANT" for all users in `Layout.tsx`
- [x] Commit

### Task 10.5: Simulation panel — even progress bar

- [x] Change progress bar from dollar-based to step-based: `completedSteps / SIM_STEPS.length * 100`
- [x] Each step advances ~16.7% evenly (no large jump on final settlement)
- [x] Commit

### Task 10.6: Fix dotenv loading for PayPal API

- [x] Install `dotenv` and add to `server/src/index.ts` with explicit path: `resolve(__dirname, "../../.env")`
- [x] Previously, PayPal credentials weren't loaded → invoice creation failed silently
- [x] Commit

### Task 10.7: Fix QR code multipart parsing

- [x] PayPal's QR code endpoint returns multipart form-data, not raw PNG
- [x] Extract base64 image data between multipart boundaries using regex: `qrText.match(/\r\n\r\n([\s\S]+?)\r\n--/)`
- [x] Construct proper `data:image/png;base64,` data URI
- [x] Commit

### Task 10.8: 403 Forbidden error handling on checkout pages

- [x] Detect `res.status === 403` in `handleCreateOrder` on all 3 checkout pages
- [x] Show "Please switch to Customer role" message instead of generic "Something went wrong"
- [x] Use `setError((prev) => prev || ...)` in `onError` to preserve specific error messages
- [x] Commit

### Task 10.9: Mock data for Jan/Feb 2026

- [x] Added 7 January bookings (authorize, vault, instant, invoice) with charges across all flows
- [x] Added 9 February bookings with variety (including 1 voided)
- [x] Monthly Revenue chart now shows 4 months of data (Jan–Apr)
- [x] Commit
