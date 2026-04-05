# TERRA iOS — Test Cases (TDD)

> Tests are written BEFORE implementation code. Each test must be seen to FAIL before writing production code.
> Test target: `trip-iosTests` (XCTest + Swift Testing framework)

---

## Section 1: Foundation & Theme

### 1.3 TerraColors

| # | Test | Expected | Type |
|---|------|----------|------|
| T1.3.1 | `Color.terraTerracotta` RGB matches #A0522D | R=160, G=82, B=45 | Unit |
| T1.3.2 | `Color(hex: "#FF0000")` produces pure red | R=255, G=0, B=0 | Unit |
| T1.3.3 | `Color(hex: "invalid")` falls back gracefully (no crash) | Returns clear or default | Unit |
| T1.3.4 | `Color(hex: "#abc")` handles 3-char shorthand or rejects gracefully | Defined behavior, no crash | Edge |
| T1.3.5 | All 12 color constants are distinct (no duplicates) | Set of 12 unique values | Unit |

### 1.4 TerraTypography

| # | Test | Expected | Type |
|---|------|----------|------|
| T1.4.1 | `Font.terraLargeTitle` uses "Inter-Bold" at 28pt | Font descriptor matches | Unit |
| T1.4.2 | `Font.terraBody` uses system font at 14pt | Not Inter, is system | Unit |
| T1.4.3 | `Font.terraFootnote` is 11pt (not 10pt — WCAG fix) | Size == 11 | Unit |

### 1.5 TerraSpacing

| # | Test | Expected | Type |
|---|------|----------|------|
| T1.5.1 | `TerraSpacing.md` equals 16 | 16.0 | Unit |
| T1.5.2 | All spacing values are multiples of 4 | val % 4 == 0 for all except sm(12) | Unit |
| T1.5.3 | `screenEdge` < `screenEdgeIPad` | 16 < 20 | Unit |

### 1.8 APIClient

| # | Test | Expected | Type |
|---|------|----------|------|
| T1.8.1 | `APIClient` uses default baseURL `http://localhost:3001` | URL matches | Unit |
| T1.8.2 | `APIClient` reads UserDefaults override for baseURL | Custom URL used | Unit |
| T1.8.3 | `APIClient` adds `X-User-Role` header to requests | Header present with correct value | Unit |
| T1.8.4 | `APIClient` adds `Content-Type: application/json` header | Header present | Unit |
| T1.8.5 | `APIClient` decodes snake_case JSON to camelCase Swift | `base_price` → `basePrice` | Unit |
| T1.8.6 | `APIClient` throws `.networkError` on connection failure | Error type matches | Error |
| T1.8.7 | `APIClient` throws `.serverError(statusCode: 500)` on 500 response | Status code captured | Error |
| T1.8.8 | `APIClient` throws `.decodingError` on invalid JSON | Error type matches | Error |
| T1.8.9 | `APIClient` times out after 30 seconds | URLError.timedOut thrown | Edge |
| T1.8.10 | `APIError.serverError.localizedDescription` is human-readable | Non-empty string, contains status code | Unit |

---

## Section 2: Auth & Navigation

### 2.1 User Model

| # | Test | Expected | Type |
|---|------|----------|------|
| T2.1.1 | `User` decodes from JSON `{"id":"u1","name":"John Doe","email":"john@test.com"}` | All fields populated | Unit |
| T2.1.2 | `User.avatarInitials` for "John Doe" returns "JD" | "JD" | Unit |
| T2.1.3 | `User.avatarInitials` for single-name "Madonna" returns "M" | "M" | Edge |
| T2.1.4 | `User.avatarInitials` for empty name returns "" | "" | Edge |
| T2.1.5 | `UserRole.customer.rawValue` equals "customer" (matches server header) | "customer" | Unit |
| T2.1.6 | `UserRole` round-trips through JSON encoding/decoding | .merchant == decoded | Unit |

### 2.2 AuthStore

| # | Test | Expected | Type |
|---|------|----------|------|
| T2.2.1 | `AuthStore` starts with `isLoggedIn == false` | false | Unit |
| T2.2.2 | After `login(user:role:)`, `isLoggedIn == true` | true | Unit |
| T2.2.3 | After `login`, `currentUser` matches provided user | User fields match | Unit |
| T2.2.4 | After `logout()`, `currentUser` is nil | nil | Unit |
| T2.2.5 | After `logout()`, `isLoggedIn == false` | false | Unit |
| T2.2.6 | `switchRole(.merchant)` sets `role` to `.merchant` | .merchant | Unit |
| T2.2.7 | `switchRole` resets all `navigationPaths` to empty | All paths empty | Critical |
| T2.2.8 | `switchRole` sets `selectedTab` to `.home` | .home | Unit |
| T2.2.9 | State persists to UserDefaults after login | UserDefaults has encoded user | Persist |
| T2.2.10 | State restores from UserDefaults on init | Restored user matches saved | Persist |
| T2.2.11 | `logout` clears UserDefaults keys | Keys removed | Persist |
| T2.2.12 | Login with nil user (edge case) doesn't crash | Graceful handling | Edge |

### 2.3 Tab & NavigationDestination

| # | Test | Expected | Type |
|---|------|----------|------|
| T2.3.1 | `Tab.allCases` returns exactly 4 tabs | .home, .search, .bookings, .profile | Unit |
| T2.3.2 | `Tab.home.sfSymbol` equals "house" | "house" | Unit |
| T2.3.3 | `NavigationDestination.tripDetail(slug:)` is Hashable | Compiles and hashes | Unit |
| T2.3.4 | Two destinations with same slug are equal | == returns true | Unit |
| T2.3.5 | Two destinations with different slugs are not equal | == returns false | Unit |

---

## Section 3: Trip Browsing

### 3.1 Trip Model

| # | Test | Expected | Type |
|---|------|----------|------|
| T3.1.1 | `Trip` decodes from real API JSON (snake_case) | All fields populated | Unit |
| T3.1.2 | `Trip` with `itinerary` array of 5 days decodes correctly | 5 ItineraryDay objects | Unit |
| T3.1.3 | `Trip` with `daily_rate: null` decodes as `dailyRate: nil` | nil | Unit |
| T3.1.4 | `Trip` with `daily_rate: 50.0` decodes correctly | 50.0 | Unit |
| T3.1.5 | `Trip.category` enum decodes "tour", "car_rental", "cruise" | Correct enum cases | Unit |
| T3.1.6 | `Trip.paymentFlow` enum decodes "authorize", "vault", "invoice", "instant" | Correct enum cases | Unit |
| T3.1.7 | `Trip` with unknown `payment_flow` value throws decodingError | Error thrown | Error |
| T3.1.8 | `ItineraryDay` decodes `{"day":1,"title":"Arrive","details":"..."}` | Fields match | Unit |

### 3.2 TripService

| # | Test | Expected | Type |
|---|------|----------|------|
| T3.2.1 | `fetchTrips()` returns array of Trip from mock JSON | Non-empty array | Unit |
| T3.2.2 | `fetchTrips()` propagates network error as `.networkError` | Correct error type | Error |
| T3.2.3 | `fetchTrip(slug: "tokyo-cherry-blossom")` returns single Trip | Trip.slug matches | Unit |
| T3.2.4 | `fetchTrip(slug: "nonexistent")` throws `.serverError(404)` | 404 error | Error |

### 3.3 TripStore

| # | Test | Expected | Type |
|---|------|----------|------|
| T3.3.1 | `TripStore` starts with `isLoading == true` | true | Unit |
| T3.3.2 | After fetch, `trips` is populated and `isLoading == false` | Non-empty, false | Unit |
| T3.3.3 | Setting `selectedCategory` to `.carRental` filters correctly | Only car rentals | Unit |
| T3.3.4 | `filteredTrips` returns all when category is `.all` (or equivalent) | All trips | Unit |
| T3.3.5 | Empty category returns empty `filteredTrips` | Empty array | Edge |
| T3.3.6 | Fetch failure sets `error` and `isLoading == false` | Error set, not loading | Error |
| T3.3.7 | Pull-to-refresh replaces existing trips with fresh data | Updated data | Unit |

---

## Section 4: Payment Flows

### 4.1 OrderService

| # | Test | Expected | Type |
|---|------|----------|------|
| T4.1.1 | `createOrder(tripSlug:intent:.authorize)` sends POST with correct body | Body includes intent | Unit |
| T4.1.2 | `createOrder` returns `orderId` from response | Non-empty string | Unit |
| T4.1.3 | `authorizeOrder(id:)` sends POST to correct path | `/api/orders/{id}/authorize` | Unit |
| T4.1.4 | `captureOrder(id:)` sends POST to correct path | `/api/orders/{id}/capture` | Unit |
| T4.1.5 | Network error propagates as `APIError.networkError` | Error type matches | Error |

### 4.1b VaultService

| # | Test | Expected | Type |
|---|------|----------|------|
| T4.1.6 | `chargeVault(token:amount:description:)` sends correct body | token, amount, desc in body | Unit |
| T4.1.7 | `chargeVault` with amount 0 or negative — validation behavior | Defined behavior | Edge |
| T4.1.8 | `deleteVault(token:)` sends DELETE to correct path | `/api/vault/{token}` | Unit |

### 4.1c InvoiceService

| # | Test | Expected | Type |
|---|------|----------|------|
| T4.1.9 | `createTripRequest(...)` sends all form fields in body | destinations, activities, dates, notes | Unit |
| T4.1.10 | `pollInvoiceStatus(id:)` retries up to 60 times at 5s intervals | Max retries respected | Unit |
| T4.1.11 | `pollInvoiceStatus` returns early when status is "PAID" | Stops polling | Unit |
| T4.1.12 | `pollInvoiceStatus` throws after 60 retries with non-PAID status | Timeout error | Error |

### 4.10 PayLaterMessage

| # | Test | Expected | Type |
|---|------|----------|------|
| T4.10.1 | `PayLaterMessage(total: 162.0, style: .full)` shows "$40.50" installment | 162/4 = 40.50 | Unit |
| T4.10.2 | `PayLaterMessage(total: 100.0, style: .full)` shows "$25.00" | 100/4 = 25.00 | Unit |
| T4.10.3 | `PayLaterMessage(total: 99.99, style: .full)` rounds correctly | 99.99/4 = 25.00 (rounded) | Edge |
| T4.10.4 | `PayLaterMessage(total: 0, style: .full)` handles zero | "$0.00" or hidden | Edge |
| T4.10.5 | `.link` style renders text-only (no button) | No button in hierarchy | Unit |

---

## Section 5: Customer Bookings

### 5.1 BookingService & BookingStore

| # | Test | Expected | Type |
|---|------|----------|------|
| T5.1.1 | `Booking` decodes from API JSON with all nullable fields null | No crash, nils | Unit |
| T5.1.2 | `Booking` decodes with all fields populated | All values present | Unit |
| T5.1.3 | `BookingCharge` decodes charge types: deposit, balance, addon, setup_fee, final, full_payment | All enum cases | Unit |
| T5.1.4 | `BookingDetail` includes nested `charges` array | Array decoded | Unit |
| T5.1.5 | `BookingStore.fetchBookings()` populates `bookings` array | Non-empty | Unit |
| T5.1.6 | `BookingStore` fetch error sets `error` property | Error set | Error |

### 5.4 PaymentTimeline

| # | Test | Expected | Type |
|---|------|----------|------|
| T5.4.1 | Flow 1 timeline has 3 steps: deposit auth, deposit capture, balance | 3 TimelineSteps | Unit |
| T5.4.2 | Flow 4 timeline has 1 step: full payment captured | 1 TimelineStep | Unit |
| T5.4.3 | Completed steps show `.done` state | isDone == true | Unit |
| T5.4.4 | Pending steps show `.pending` state | isDone == false | Unit |
| T5.4.5 | Flow 2 timeline includes variable add-on charges | Dynamic step count | Unit |

### 5.5 BookingDetail - Business Logic

| # | Test | Expected | Type |
|---|------|----------|------|
| T5.5.1 | Progress ratio for $200 paid of $800 total = 0.25 | 0.25 | Unit |
| T5.5.2 | Progress ratio for $800 paid of $800 total = 1.0 | 1.0 | Unit |
| T5.5.3 | Progress ratio for $0 paid = 0.0 | 0.0 | Edge |
| T5.5.4 | Authorization countdown: created today, 29-day window → 29 days remaining | 29 | Unit |
| T5.5.5 | Authorization countdown: created 25 days ago → 4 days remaining | 4 | Unit |
| T5.5.6 | Authorization countdown: created 30 days ago → 0 or expired | 0 or negative handled | Edge |
| T5.5.7 | Authorization countdown: nil `authorization_expires_at` → hidden | No countdown shown | Edge |

---

## Section 6: Merchant Features

### 6.1 MerchantService

| # | Test | Expected | Type |
|---|------|----------|------|
| T6.1.1 | `MerchantStats` decodes: activeBookings, pendingCaptures, openInvoices, monthlyRevenue | All fields | Unit |
| T6.1.2 | `monthlyRevenue` formats as currency string "$1,234.56" | Correct format | Unit |
| T6.1.3 | `captureBalance(orderId:)` sends POST with correct path | Path matches | Unit |
| T6.1.4 | `voidAuth(orderId:)` sends correct request | Path + method match | Unit |

### 6.5 CaptureBalanceView - Business Logic

| # | Test | Expected | Type |
|---|------|----------|------|
| T6.5.1 | Capture amount = totalAmount - depositAmount (800 - 200 = 600) | 600.0 | Unit |
| T6.5.2 | Capture amount when deposit = 0 equals total | totalAmount | Edge |
| T6.5.3 | Capture amount when fully paid = 0 | 0.0 | Edge |

### 6.6 ChargeAddonSheet - Validation

| # | Test | Expected | Type |
|---|------|----------|------|
| T6.6.1 | Custom amount "50" parses to 50.0 | 50.0 | Unit |
| T6.6.2 | Custom amount "0" is invalid | Validation fails | Edge |
| T6.6.3 | Custom amount "-10" is invalid | Validation fails | Edge |
| T6.6.4 | Custom amount "" (empty) is invalid | Validation fails | Edge |
| T6.6.5 | Custom amount "abc" is invalid | Validation fails | Edge |
| T6.6.6 | Custom amount "50.99" parses correctly | 50.99 | Unit |
| T6.6.7 | Preset "Travel Insurance $50" populates amount=50 and description="Travel Insurance" | Both fields set | Unit |
| T6.6.8 | Form `isDirty` is true when amount or description is entered | true | Unit |
| T6.6.9 | Form `isDirty` is false when fields are empty/reset | false | Unit |

---

## Cross-Cutting: Currency Formatting

| # | Test | Expected | Type |
|---|------|----------|------|
| TC.1 | `Double(162.0).asCurrency` returns "$162.00" | "$162.00" | Unit |
| TC.2 | `Double(1234.5).asCurrency` returns "$1,234.50" | "$1,234.50" | Unit |
| TC.3 | `Double(0).asCurrency` returns "$0.00" | "$0.00" | Edge |
| TC.4 | `Double(99.999).asCurrency` rounds to "$100.00" | "$100.00" | Edge |

## Cross-Cutting: Date Formatting

| # | Test | Expected | Type |
|---|------|----------|------|
| TC.5 | ISO date "2026-04-10T00:00:00Z" formats as "Apr 10, 2026" | "Apr 10, 2026" | Unit |
| TC.6 | Relative date "in 24 days" for countdown | "24 days remaining" | Unit |
| TC.7 | Nil date returns nil formatted string (no crash) | nil | Edge |

---

## Integration / E2E Test Scenarios

### Flow 1: Authorize & Capture (Happy Path)

| Step | Action | Expected |
|------|--------|----------|
| E2E-1.1 | Browse tours tab, tap "Tokyo Cherry Blossom" | TripDetailView shows with itinerary |
| E2E-1.2 | Tap "Reserve with Deposit" | CheckoutRouter → AuthorizeCheckoutView |
| E2E-1.3 | Verify fee breakdown shows $200 deposit / $600 balance / $800 total | Amounts correct |
| E2E-1.4 | Tap PayPal button → approve in sandbox | ProcessingOverlay appears |
| E2E-1.5 | Payment completes | ConfirmationView with "Deposit Authorized!", TERRA-XXXX ref, step 1/2 |
| E2E-1.6 | Tap "View My Bookings" | BookingListView with new booking, status "Deposit Paid" |
| E2E-1.7 | Tap booking → detail | Timeline: deposit captured ✓, balance pending |
| E2E-1.8 | Switch to merchant role | MerchantBookingDetailView with "Capture Balance" button |
| E2E-1.9 | Tap "Capture Balance" | CaptureBalanceView showing $600 |
| E2E-1.10 | Confirm capture | Success card, "Booking Completed" badge |

### Flow 2: Vault (Happy Path)

| Step | Action | Expected |
|------|--------|----------|
| E2E-2.1 | Browse tours, select vault trip | TripDetailView with "How It Works" |
| E2E-2.2 | Tap "Pay Setup Fee" | VaultCheckoutView |
| E2E-2.3 | Complete PayPal payment | Confirmation with vault status |
| E2E-2.4 | Switch to merchant, find booking | "Charge Add-on" button visible |
| E2E-2.5 | Tap "Charge Add-on" | ChargeAddonSheet opens |
| E2E-2.6 | Select "Travel Insurance $50" preset, charge | Amount populated, charge succeeds |
| E2E-2.7 | Tap "Final Settlement" | Confirmation dialog → settle |
| E2E-2.8 | Verify booking completed | Status badge "Completed" |

### Flow 3: Invoice (Happy Path)

| Step | Action | Expected |
|------|--------|----------|
| E2E-3.1 | Browse tours, select invoice trip | TripDetailView |
| E2E-3.2 | Tap "Request Custom Trip" | InvoiceRequestView form |
| E2E-3.3 | Fill destinations, activities, dates, notes | Form validates |
| E2E-3.4 | Submit request | Confirmation: "Request Submitted" |
| E2E-3.5 | Switch to merchant | Trip request visible |
| E2E-3.6 | Invoice auto-created and sent | Invoice status trackable |

### Flow 4: Instant Capture (Happy Path)

| Step | Action | Expected |
|------|--------|----------|
| E2E-4.1 | Browse car rentals, select "Economy Sedan" | Car detail with date picker |
| E2E-4.2 | Set pickup/dropoff dates (3 days) | Total: $162.00 (3 x $50 + tax) |
| E2E-4.3 | Tap "Continue to Checkout" | InstantCheckoutView |
| E2E-4.4 | Verify Pay Later message shows "$40.50" installments | 162/4 = 40.50 |
| E2E-4.5 | Tap PayPal → approve | Full capture → "Booking Confirmed!" |
| E2E-4.6 | View booking detail | Single "Payment Captured" timeline step |

### Error Scenarios

| # | Scenario | Expected |
|---|----------|----------|
| ERR-1 | Network offline during trip fetch | ErrorBanner "No internet connection" + Retry |
| ERR-2 | Server 500 during order creation | ErrorBanner with error message + Retry |
| ERR-3 | User cancels PayPal sheet | Returns to checkout, no error shown |
| ERR-4 | PayPal SDK error during approval | ErrorBanner with "Try Again" |
| ERR-5 | Double-tap PayPal button rapidly | Only one order created (button disabled on first tap) |
| ERR-6 | Swipe back during ProcessingOverlay | Blocked — user stays on processing screen |
| ERR-7 | Server returns invalid JSON | `.decodingError` → ErrorBanner |
| ERR-8 | Empty bookings list | EmptyStateView with "No bookings yet" + CTA |
| ERR-9 | Auth token expired (29+ days) | Countdown shows "Expired", capture button disabled |
| ERR-10 | Vault charge with $0 amount | Validation prevents submission |

### Accessibility Scenarios

| # | Scenario | Expected |
|---|----------|----------|
| A11Y-1 | VoiceOver on TripCardView | Reads: trip name, price, duration, payment type |
| A11Y-2 | VoiceOver on StatusBadge "Completed" | Reads: "Completed" (not just color) |
| A11Y-3 | VoiceOver on PayPal button | Reads: "Pay with PayPal" |
| A11Y-4 | ErrorBanner appears | VoiceOver announces error message |
| A11Y-5 | Reduce Motion enabled | No parallax, no stagger, no scale animation |
| A11Y-6 | Dynamic Type AX3 | No text truncation, all content scrollable |
| A11Y-7 | Icon-only back button | VoiceOver reads "Back" |

### iPad Scenarios

| # | Scenario | Expected |
|---|----------|----------|
| IPAD-1 | Landscape mode | NavigationSplitView: sidebar + detail |
| IPAD-2 | Portrait mode | Single column or collapsed sidebar |
| IPAD-3 | Trip grid | 2 columns |
| IPAD-4 | ChargeAddonSheet | Renders as `.formSheet`, not full screen |
| IPAD-5 | Role switch | All navigation paths reset, sidebar reflects tabs |

---

## Test Infrastructure Notes

### Test Target Setup
- Add `trip-iosTests` target to Xcode project (XCTest)
- Use Swift Testing framework (`@Test`, `#expect`) for new tests where available
- Create `Mocks/` folder for `MockAPIClient`, `MockURLProtocol`

### Mocking Strategy
- **APIClient**: Use `URLProtocol` subclass to intercept network requests with fixture JSON
- **PayPalManager**: Protocol-based mock (`PayPalCheckoutProtocol`) — SDK cannot be tested in unit tests
- **UserDefaults**: Use `UserDefaults(suiteName:)` with test-specific suite, cleared in teardown
- **SwiftData**: Use in-memory `ModelConfiguration(isStoredInMemoryOnly: true)` for test isolation

### Fixture JSON Files
Create `Tests/Fixtures/` with:
- `trips.json` — array of 3 trips (one per category)
- `trip-detail.json` — single trip with full itinerary
- `booking.json` — booking with charges
- `merchant-stats.json` — KPI data
- `error-404.json` — `{"error": "Trip not found"}`
- `error-500.json` — `{"error": "Internal server error"}`

### Test Naming Convention
```swift
@Test func tripDecodesFromSnakeCaseJSON() { }
@Test func authStoreResetsNavigationOnRoleSwitch() { }
@Test func captureAmountEqualsTotal​MinusDeposit() { }
```

Format: `{subject}{behavior}{condition}` in camelCase.

---

## Summary

| Category | Count | Priority |
|----------|-------|----------|
| Unit tests (models, services, stores, logic) | 68 | Write first |
| Edge case tests | 18 | Write with unit tests |
| Error handling tests | 12 | Write with services |
| E2E flow tests | 4 flows (31 steps) | After all sections |
| Accessibility tests | 7 | Section 7 |
| iPad tests | 5 | Section 7 |
| **Total** | **~110** | |
