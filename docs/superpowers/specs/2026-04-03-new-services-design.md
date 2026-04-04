# TERRA Trip Demo — New Services Design Spec

## Overview

Add 2 new service categories to the existing TERRA trip booking demo:

1. **Car Rental** (Flow 4) — Instant Capture + PayPal Pay Later messaging
2. **Cruise Trip** (Flow 5) — Authorize & Capture (partial), same pattern as Flow 1

This brings the total to 5 product types across 3 categories (Tours, Car Rentals, Cruises) with 5 distinct PayPal integration patterns.

---

## Service 4: Car Rental — Instant Capture + Pay Later

### Product Data

| Car | Slug | Daily Rate | Category |
|-----|------|-----------|----------|
| Economy Sedan | `economy-sedan` | $50/day | car_rental |
| SUV | `suv-rental` | $100/day | car_rental |
| Luxury Convertible | `luxury-convertible` | $150/day | car_rental |

### Images

| Car | Image File |
|-----|-----------|
| Economy Sedan | `/car-rental-car.webp` |
| SUV | `/car-rental-suv.webp` |
| Luxury Convertible | `/car-rental-luxury.jpg` |

### Payment Flow: `instant`

- **Intent:** `CAPTURE` — full payment at checkout, no deposit/balance split
- **Pricing:** `daily_rate × number_of_days` — customer selects pickup/dropoff dates
- **Server calculates total** — never trust client amount
- **Booking status:** `CONFIRMED` (single step, no multi-phase)

### PayPal Pay Later Integration

**SDK Configuration:**
- Each checkout page wraps its own `PayPalScriptProvider` (NOT in App.tsx). The new `CheckoutInstantPage` will have its own provider with:
  - `components: "buttons,messages"`
  - `enable-funding: "paylater"`
  - `intent: "capture"`
  - `buyer-country: "US"` (required for Pay Later eligibility in sandbox)
- The car detail page also needs a `PayPalScriptProvider` wrapping the `PayPalMessages` component (messages-only, no buttons, with `buyer-country: "US"`)

**Standalone Buttons (stacked vertically):**
1. `PayPalButtons` with `fundingSource={FUNDING.PAYPAL}` — renders yellow PayPal button
2. `PayPalButtons` with `fundingSource={FUNDING.PAYLATER}` — renders blue Pay Later button
3. `PayPalMessages` component — placed directly under the Pay Later button

**Pay Later Message Placements:**
- **Car detail page:** `PayPalMessages` with `placement="product"` and `amount={calculatedTotal}`
  - Updates dynamically as dates change and total recalculates
- **Checkout page:** `PayPalMessages` with `placement="payment"` and `amount={totalPrice}`
  - Placed under the blue Pay Later button

**Message Styling:**
```jsx
<PayPalMessages
  style={{
    layout: "text",
    logo: { type: "inline" },
    text: { color: "black", size: "12" },
  }}
  amount={totalPrice}
  placement="payment"
/>
```

### Car Detail Page

- Split hero layout (text left, photo right with mask-image gradient fade — same as trip detail)
- **Date picker section:** Pickup date + Dropoff date inputs
- **Live total calculation:** Shows `$X/day × N days = $Total`
- **Pay Later message** below the price with `placement="product"` showing financing options
- **"Book Now" button** → navigates to checkout via `useNavigate` with dates passed in React Router `state` (e.g., `navigate(\`/checkout/\${slug}\`, { state: { pickupDate, dropoffDate } })`). CheckoutInstantPage reads dates from `useLocation().state`

### Checkout Page (`CheckoutInstantPage`)

- Order summary card: car name, photo, pickup/dropoff dates, daily rate, number of days, total
- **Stacked payment buttons:**
  1. PayPal button (yellow) — `fundingSource={FUNDING.PAYPAL}`
  2. Pay Later button (blue) — `fundingSource={FUNDING.PAYLATER}`
  3. PayPal Messages — under Pay Later button
- Both buttons share the same `createOrder` / `onApprove` callbacks
- `createOrder` → POST `/api/orders` with `intent: "capture"`, slug, pickup/dropoff dates
- `onApprove` → POST `/api/orders/:orderId/capture` → redirect to booking confirmation

### Server-Side (orders.ts)

- **Create order:** New path for `intent: "capture"` — calculates `daily_rate × days`, creates PayPal order with `intent: "CAPTURE"`
- **Capture:** On approve, capture the order (not authorize). Save booking with status `CONFIRMED` and `paid_amount = total_amount`
- Server validates dates (dropoff > pickup, reasonable range)

### Booking Status Flow

```
CONFIRMED (single step — payment complete)
```

No deposit/balance phases. Merchant dashboard shows these as completed bookings.

---

## Service 5: Cruise Trip — Authorize & Capture (Partial)

### Product Data

| Cruise | Slug | Price | Deposit (25%) | Duration |
|--------|------|-------|--------------|----------|
| Caribbean Island Hopper | `caribbean-cruise` | $2,800 | $700 | 7 days |
| Mediterranean Explorer | `mediterranean-cruise` | $4,500 | $1,125 | 10 days |
| Alaska Glacier Discovery | `alaska-cruise` | $1,900 | $475 | 5 days |

### Images

| Cruise | Image File |
|--------|-----------|
| Caribbean Island Hopper | `/cruises-caribbean.webp` (alt: `/cruises-caribbean2.jpg`) |
| Mediterranean Explorer | `/cruises-mediterranean.webp` |
| Alaska Glacier Discovery | `/cruise-alaska.webp` |

### Payment Flow: `authorize` (reuse existing Flow 1)

- **Intent:** `AUTHORIZE` — same as Tokyo Cherry Blossom trip
- **Deposit:** Partial capture of 25% on booking
- **Balance:** Merchant captures remaining 75% before departure (within 29-day auth window)
- **Void:** Merchant can void if customer cancels before balance capture

### Reused Infrastructure

This flow reuses nearly all existing authorize & capture code:

| Component | Reuse |
|-----------|-------|
| `server/src/routes/orders.ts` | Same create order (authorize intent) + authorize + partial capture |
| `server/src/routes/bookings.ts` | Same capture balance + void endpoints |
| `CheckoutAuthorizePage.tsx` | Same checkout UI (deposit/balance breakdown + PayPal buttons) |
| `AuthorizeBookingDetailPage.tsx` | Same merchant detail page (capture balance, void, countdown) |
| Booking statuses | Same: `DEPOSIT_AUTHORIZED` → `DEPOSIT_PAID` → `FULLY_PAID` |

### New Code Required

- **Seed data:** 3 cruise trip records with itineraries in `seed.sql`
- **Cruise detail page content:** Itinerary, cabin info, departure details
- **Image mapping:** Add cruise slugs to `tripImages` record

### Cruise Detail Page

- Split hero layout (same as existing trip detail)
- Itinerary timeline (reuse existing component)
- Deposit/balance breakdown display
- "Reserve Now" button → checkout (same as Tokyo flow)

### Itineraries

**Caribbean Island Hopper (7 days):**

```json
[
  { "day": 1, "title": "Miami Departure", "details": "Board the ship, welcome dinner, safety briefing" },
  { "day": 2, "title": "At Sea", "details": "Pool deck, spa, entertainment shows" },
  { "day": 3, "title": "Cozumel, Mexico", "details": "Snorkeling at Palancar Reef, downtown shopping" },
  { "day": 4, "title": "Grand Cayman", "details": "Seven Mile Beach, stingray sandbar excursion" },
  { "day": 5, "title": "Jamaica", "details": "Dunn's River Falls, jerk chicken tasting" },
  { "day": 6, "title": "At Sea", "details": "Captain's gala dinner, sunset deck party" },
  { "day": 7, "title": "Return to Miami", "details": "Disembark, farewell brunch" }
]
```

**Mediterranean Explorer (10 days):**

```json
[
  { "day": 1, "title": "Barcelona Departure", "details": "Board the ship, welcome cocktails, Sagrada Familia views from deck" },
  { "day": 2, "title": "Marseille, France", "details": "Old Port walking tour, bouillabaisse lunch" },
  { "day": 3, "title": "Genoa, Italy", "details": "Cinque Terre day trip, pesto cooking class" },
  { "day": 4, "title": "Rome (Civitavecchia)", "details": "Colosseum tour, Vatican Museums, Roman gelato" },
  { "day": 5, "title": "Naples, Italy", "details": "Pompeii ruins, Neapolitan pizza, Amalfi Coast views" },
  { "day": 6, "title": "At Sea", "details": "Wine tasting seminar, pool day, sunset meditation" },
  { "day": 7, "title": "Mykonos, Greece", "details": "Windmills, Little Venice, beach club afternoon" },
  { "day": 8, "title": "Santorini, Greece", "details": "Oia sunset, caldera hike, local wine tour" },
  { "day": 9, "title": "At Sea", "details": "Captain's farewell dinner, photo gallery, live music" },
  { "day": 10, "title": "Return to Barcelona", "details": "Disembark, farewell brunch, La Rambla stroll" }
]
```

**Alaska Glacier Discovery (5 days):**

```json
[
  { "day": 1, "title": "Seattle Departure", "details": "Board the ship, welcome dinner, Inside Passage briefing" },
  { "day": 2, "title": "At Sea (Inside Passage)", "details": "Whale watching from deck, glacier documentary, hot cocoa bar" },
  { "day": 3, "title": "Juneau, Alaska", "details": "Mendenhall Glacier hike, whale watching excursion, salmon bake" },
  { "day": 4, "title": "Glacier Bay", "details": "Full-day glacier cruising, ranger talks, wildlife spotting (bears, eagles)" },
  { "day": 5, "title": "Return to Seattle", "details": "Disembark, farewell brunch, Pike Place Market visit" }
]
```

---

## Homepage Reorganization

### Tabbed Layout

Replace the current single grid with 3 tabs:

| Tab | Category Filter | Products |
|-----|----------------|----------|
| **Tours** | `tour` | Tokyo Cherry Blossom, Bali Adventure, Custom European Tour |
| **Car Rentals** | `car_rental` | Economy Sedan, SUV, Luxury Convertible |
| **Cruises** | `cruise` | Caribbean, Mediterranean, Alaska |

### Tab Implementation

- Use shadcn `Tabs` component
- Default tab: Tours (preserves existing behavior)
- URL query param `?tab=tour|car_rental|cruise` for deep linking (matches category values in DB)
- Each tab renders the same `TripCard` grid, filtered by `category`

### Card Adaptations by Category

| Category | Price Display | Badge | CTA |
|----------|--------------|-------|-----|
| Tours | `$X` (fixed price) | Flow-specific (Reserve Now / Add-ons / Custom) | Book Now |
| Car Rentals | `From $X/day` | "Pay Later Available" | Rent Now |
| Cruises | `$X` + `Deposit: $Y` | "Reserve Now" | Reserve Now |

---

## Schema Changes

### Schema Migration Strategy

This is a demo app that rebuilds the DB from scratch via `schema.sql` + `seed.sql`. No ALTER TABLE migrations needed — modify the CREATE TABLE statement directly in `schema.sql` and update `seed.sql` with new rows. Delete the existing SQLite DB file to rebuild.

### New Columns (in CREATE TABLE trips)

```sql
category TEXT NOT NULL DEFAULT 'tour',
-- Values: 'tour', 'car_rental', 'cruise'

daily_rate REAL,
-- Only populated for car_rental category, NULL for others
```

### Updated CHECK Constraint

```sql
payment_flow TEXT NOT NULL CHECK(payment_flow IN ('authorize','vault','invoice','instant')),
```

### New payment_flow Value

- `'instant'` — for car rentals (intent: CAPTURE, full payment)
- Cruise reuses existing `'authorize'` value

### Car Rental Seed Values

For car rentals, `base_price` stores the daily rate (same as `daily_rate`), and `deposit_amount` is `0` (no deposit concept for instant capture):

| Field | Value |
|-------|-------|
| `base_price` | Same as `daily_rate` (e.g., 50, 100, 150) |
| `deposit_amount` | `0` |
| `duration_days` | `0` (variable — depends on rental dates) |

### Updated Trip Type Interface

```typescript
interface Trip {
  id: string;
  slug: string;
  name: string;
  description: string;
  duration_days: number;
  base_price: number;
  deposit_amount: number;
  payment_flow: "authorize" | "vault" | "invoice" | "instant";
  category: "tour" | "car_rental" | "cruise";
  daily_rate: number | null;
  itinerary: ItineraryDay[];
  image_gradient: string;
}
```

---

## Prerequisite: Extract Shared Constants

Before adding new products, extract duplicated constants into a shared module to avoid copy-pasting across 6+ files:

**Create `client/src/lib/constants.ts`** containing:

- `tripImages` — currently duplicated in TripCard, TripDetailPage, BookingsPage, BookingDetailPage, CheckoutAuthorizePage, CheckoutVaultPage
- `STATUS_LABELS` — currently duplicated in BookingsPage, BookingDetailPage, MerchantBookingsPage

All existing files that define these locally must be updated to import from the shared module. New product slugs are added only to this single file.

## New Files

| File | Purpose |
|------|---------|
| `client/src/lib/constants.ts` | Shared tripImages, STATUS_LABELS (extracted from 6+ files) |
| `client/src/pages/checkout/CheckoutInstantPage.tsx` | Car rental checkout with standalone PayPal + Pay Later buttons |
| `client/src/components/PayLaterMessage.tsx` | Reusable PayPalMessages wrapper with consistent styling |

## Modified Files

| File | Change |
|------|--------|
| `server/src/db/schema.sql` | Add `category` and `daily_rate` columns, update `payment_flow` CHECK constraint to include `'instant'` |
| `server/src/db/seed.sql` | Add 6 new product records (3 cars + 3 cruises) |
| `server/src/routes/orders.ts` | Add instant capture path (intent: CAPTURE) |
| `client/src/pages/HomePage.tsx` | Add tabbed layout with category filtering |
| `client/src/pages/TripDetailPage.tsx` | Add date picker for car rentals, PayPalScriptProvider + PayPalMessages for Pay Later |
| `client/src/pages/CheckoutPage.tsx` | Add `instant` case dispatching to CheckoutInstantPage |
| `client/src/components/trips/TripCard.tsx` | Add category-specific pricing display and badges |
| `client/src/pages/BookingsPage.tsx` | Import tripImages/STATUS_LABELS from shared constants |
| `client/src/pages/BookingDetailPage.tsx` | Import tripImages/STATUS_LABELS from shared constants |
| `client/src/pages/checkout/CheckoutAuthorizePage.tsx` | Import tripImages from shared constants |
| `client/src/pages/checkout/CheckoutVaultPage.tsx` | Import tripImages from shared constants |
| `client/src/pages/merchant/MerchantBookingsPage.tsx` | Import STATUS_LABELS from shared constants |

## Image Mapping (Complete)

```typescript
const tripImages: Record<string, string> = {
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
```

---

## What's NOT Changing

- Existing 3 tours (Tokyo, Bali, European) — untouched
- Flow 1 (authorize), Flow 2 (vault), Flow 3 (invoice) — untouched
- Merchant dashboard — automatically picks up new bookings via existing queries
- Auth/layout shell — unchanged
- Booking detail pages — work for new flows via existing status logic
- Simulation panel — unchanged (Flow 2 only)

---

## PayPal SDK Configuration Summary

**Single global `PayPalScriptProvider` in App.tsx** with default `intent: "capture"`. Individual pages switch intent via the `usePayPalIntent` hook which calls `resetOptions` on the SDK reducer.

```js
// App.tsx — global default options
{
  clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
  currency: "USD",
  intent: "capture",
  components: "buttons,messages",
  "enable-funding": "paylater",
  "buyer-country": "US",
}
```

### Intent Pre-loading Strategy

To avoid button flash/remount on checkout pages, the SDK intent is switched **early** — before the user reaches checkout:

1. **HomePage tabs:** `usePayPalIntent` is called based on the active tab:
   - Tours tab → `capture` (vault flow)
   - Car Rentals tab → `capture` (instant flow)
   - Cruises tab → `authorize`
2. **TripDetailPage (PricingSidebar):** `usePayPalIntent` is called based on `trip.payment_flow`:
   - `authorize` → `"authorize"`
   - All others (`vault`, `instant`, `invoice`) → `"capture"`
3. **Checkout pages:** Each checkout page still calls `usePayPalIntent` as a safety net, but by the time the user navigates there the SDK already has the correct intent loaded — buttons render instantly with no extra render cycle.

### `usePayPalIntent` hook (`client/src/lib/use-paypal-intent.ts`)

Compares `options.intent` against the requested intent. Only calls `resetOptions` when they differ, preventing unnecessary SDK reloads on re-renders or same-intent navigations.

```ts
export function usePayPalIntent(intent: "capture" | "authorize") {
  const [{ options }, dispatch] = usePayPalScriptReducer();
  useEffect(() => {
    if (options.intent === intent) return;
    dispatch({ type: "resetOptions", value: { ...options, intent } });
  }, [intent]);
}
```

### Known limitation

When `resetOptions` reloads the SDK (e.g. switching from `capture` → `authorize`), the PayPal SDK logs a `"zoid destroyed all components"` console warning. This is a known PayPal SDK behavior when the script tag is replaced and does not affect functionality.

---

## UX Improvements (from UI/UX Review)

### Accessibility (WCAG AA)

- **Muted text color:** Darken from `#8a7e74` to `#5e5549` (~5.5:1 contrast on Alpine Oat) across all pages
- **Focus styles:** Add `:focus-visible { outline: 2px solid var(--terracotta); outline-offset: 2px }` on all buttons, links, inputs
- **Date input focus ring:** Increase box-shadow opacity from `0.1` to `0.25`
- **Trust badge text:** Increase from `11px` to `12px` minimum
- **Timeline dots:** Add checkmark icon inside completed dots (not color-only). Current dot gets pulse animation
- **Emoji icons:** Replace with Lucide React icons with proper ARIA labels in implementation

### Car Rental UX

- **Category badge:** Use Terracotta (TERRA brand) instead of PayPal blue. Label: "CAR RENTAL" not "PAY LATER AVAILABLE"
- **Date validation:** Show inline errors ("Dropoff must be after pickup"), set min constraints, show "Minimum 1-day rental" hint
- **Subtotal in calc:** Show `$150` on the right side of the "$50/day x 3 days" line
- **Cancellation policy at checkout:** Add green banner "Free cancellation up to 24 hours before pickup" below PayPal buttons
- **Recalculation feedback:** Brief pulse/flash animation when total updates after date change

### Cruise UX

- **"Balance due" label:** Change to "Balance due later" to avoid ambiguity
- **Remove PayPal jargon:** Replace "29-day authorization window" with "charged before departure" in customer-facing copy
- **Pay Later note on checkout:** Add italic note "Pay Later is not available for deposit-based bookings"
- **Total price emphasis:** Make total amount row slightly bolder (600 weight, 14px) alongside deposit highlight
- **Highlight icons:** Use warm `#f0ebe5` (earth tone) instead of cool mint `#e8f4f0`

### Booking Detail Pages

- **Car rental confirmation:** Banner says "Payment complete" (not "deposit captured")
- **Car rental rental details section:** Show pickup/dropoff dates and daily rate breakdown (only for `payment_flow === "instant"`)
- **Car rental sidebar:** Green "Payment Complete" box, no remaining balance line
- **Cruise authorization progress bar:** Horizontal bar showing day position in auth window with pulse on current dot
- **Cruise "What Happens Next":** Numbered steps explaining post-booking flow

### Mobile Responsive

- Below 768px: stack all two-column grids to single column
- Hero goes single-column (text above image)
- Specs grid goes from 4-column to 2-column
- Features/highlights grid goes to single column
- Header nav hidden (hamburger menu in implementation)

### Mockup Files

| Page | Mockup |
|------|--------|
| Car Rental Detail | `docs/ui/car-rental-detail.html` |
| Car Rental Checkout | `docs/ui/car-rental-checkout.html` |
| Car Rental Booking Detail | `docs/ui/booking-detail-car-rental.html` |
| Cruise Detail | `docs/ui/cruise-detail.html` |
| Cruise Checkout | `docs/ui/cruise-checkout.html` |
| Cruise Booking Detail | `docs/ui/booking-detail-cruise.html` |

---

## Additional UX Improvements (2026-04-04)

### Car Rental Checkout — Payment Button UX

- **"or" divider:** Add a `── or ──` text divider between the yellow PayPal button and blue Pay Later button to communicate they are alternative payment methods (standard e-commerce pattern used by Stripe, Shopify)
- **Pay Later message grouping:** The official PayPal Pay Later messaging (`PayPalMessages` component) is grouped tightly under the Pay Later button with `space-y-2` (8px gap), centered, visually binding them as one unit
- **Fieldset legend pattern:** The payment section uses `<fieldset>` + `<legend>` instead of a `<div>` with a `<p>` label. The legend text "Pay securely with PayPal" sits on the top border line (native browser fieldset gap), bold (`font-semibold`), `text-foreground` color. This is semantic HTML and provides the "open border" visual effect
- **Removed duplicate cancellation banner:** The green "Free cancellation" banner was removed from the checkout payment section since it already appears in the "What's Included" section on the left column

### Header Branding

- **Logo text:** Changed from "TERRA" to "MERCHANT" for all users (customer and merchant roles). The header `<Link>` always shows "MERCHANT"

### Simulation Panel — Progress Bar

- **Even step progression:** Changed progress bar calculation from dollar-based (`totalCharged / TOTAL_AMOUNT`) to step-based (`completedSteps / SIM_STEPS.length`). Each of the 6 steps advances the bar by ~16.7% evenly, preventing the large jump on the final $1,450 settlement step. The `transition-all duration-700` CSS provides smooth animation

### Invoice Auto-Creation & QR Code

- **dotenv loading:** Added `dotenv` to `server/src/index.ts` with explicit path to project root `.env` file. Previously, PayPal API credentials weren't loaded when the server ran from the `server/` directory, causing invoice creation to fail silently
- **QR code multipart parsing:** PayPal's `/v2/invoicing/invoices/{id}/generate-qr-code` endpoint returns multipart form-data (not raw PNG). The response body contains a base64-encoded PNG wrapped in multipart boundaries. Fixed by extracting the base64 image data between `\r\n\r\n` and `\r\n--` delimiters instead of treating the entire response as binary
- **Confirmation page:** When invoice creation succeeds, the trip request confirmation page shows:
  - "Invoice Sent!" heading (instead of "Trip Request Submitted!")
  - Blue info card with "View & Pay Invoice" button linking to PayPal's `recipient_view_url`
  - "Copy Link" button for sharing the invoice URL
  - QR code image (300x300 PNG) with "Scan to pay" label — scannable on mobile to view and pay the invoice
- **Fallback behavior:** If PayPal invoice creation fails (network error, API error), the flow degrades gracefully to "Trip Request Submitted!" with status `REQUEST_SUBMITTED` — merchant can manually create the invoice later

### 403 Forbidden Error Handling

- **Role-specific error message:** All checkout pages (instant, authorize, vault) now detect HTTP 403 responses from `/api/orders/create` and show "Please switch to Customer role to complete checkout. Use the role switcher in the header." instead of the generic "Something went wrong with PayPal"
- **Error preservation:** The `onError` handler uses `setError((prev) => prev || "...")` to avoid overwriting a more specific error message (e.g. the 403 role message) with the generic PayPal error
