# TERRA iOS — Sections 5-7 Expanded Plan

> Parent: `ios/docs/plan-outline.md`

---

## Section 5: Customer Bookings (5 tasks)

### 5.1 BookingService & BookingStore
**Files:** `Services/BookingService.swift`, `Stores/BookingStore.swift`
**Dependencies:** Section 1 (APIClient), Section 2 (AuthStore)
**Output:** Service with `fetchBookings()` and `fetchBooking(id:)` calling `GET /api/bookings` and `GET /api/bookings/:id`. BookingStore as `@Observable` holding `bookings: [Booking]`, `isLoading`, `error`. No SwiftData caching — always fetch fresh.
**Acceptance:**
- Bookings decode all 4 flow types with correct status enums
- Pull-to-refresh triggers `fetchBookings()` and updates list
- Error state propagated to store for banner display

### 5.2 BookingCardView
**Files:** `Views/Bookings/BookingCardView.swift`
**Dependencies:** 5.1, Section 1 (TerraCard, StatusBadge)
**Output:** Row card showing trip thumbnail (AsyncImage), trip name, ref (TERRA-XXXX), StatusBadge, date, and amount. Uses TerraCard container.
**Acceptance:**
- Matches storyboard screen 6 list row style across all 3 flow HTMLs
- StatusBadge shows correct color per booking status (sage=completed, warning=pending, info=processing)
- Minimum 44pt tap target

### 5.3 BookingListView & EmptyStateView
**Files:** `Views/Bookings/BookingListView.swift`, `Views/Shared/EmptyStateView.swift`
**Dependencies:** 5.1, 5.2
**Output:** ScrollView with pull-to-refresh (`.refreshable`), list of BookingCardView rows, tap navigates to BookingDetailView. EmptyStateView shows illustration placeholder, "No bookings yet" text, and "Explore Trips" CTA button that switches to Home tab.
**Acceptance:**
- Pull-to-refresh triggers BookingStore reload with haptic on complete
- Empty state displayed when bookings array is empty
- Navigation via `NavigationLink(value:)` for type-safe push

### 5.4 PaymentTimeline Component
**Files:** `Views/Shared/PaymentTimeline.swift`
**Dependencies:** Section 1 (TerraColors)
**Output:** Reusable vertical timeline with colored dots (sage=done, gray=pending) and connecting lines. Accepts `[TimelineStep]` array where each step has title, subtitle, date, and completion state. Renders flow-specific timelines:
- Flow 1: deposit authorized > deposit captured > balance pending/captured (per authorize-flow screen 6)
- Flow 2: setup fee > add-on charges list > final settlement
- Flow 3: request submitted > invoice sent > invoice paid
- Flow 4: single "full payment captured" step (per car-rental/cruise screen 6)
**Acceptance:**
- Timeline renders correctly for all 4 flow types
- Dots and lines align with storyboard styling (20px dots, 2px connecting line)
- Supports Dynamic Type without clipping

### 5.5 BookingDetailView
**Files:** `Views/Bookings/BookingDetailView.swift`
**Dependencies:** 5.1, 5.4, Section 1 (InfoRow, TerraCard)
**Output:** Full detail screen with: header (TERRA-XXXX ref + StatusBadge), trip info card (thumbnail, name, dates), PaymentTimeline (flow-specific per 5.4), progress bar for partial payments (e.g. 25% for Flow 1 deposit-only), PayPal order details card (order ID, capture ID, status), authorization countdown for Flow 1 showing "X days remaining" with warning callout (per authorize-flow screen 6). Flow 2 additions: charges table and "Remove Saved Payment" option.
**Acceptance:**
- Progress bar width matches `amountPaid / totalAmount` ratio
- Countdown timer calculates remaining days from auth creation date (29-day window)
- Flow-specific sections conditionally rendered based on `booking.payment_flow`
- Matches layout from all 3 storyboard screen 6 references

---

## Section 6: Merchant Features (6 tasks)

### 6.1 MerchantService
**Files:** `Services/MerchantService.swift`
**Dependencies:** Section 1 (APIClient)
**Output:** Service calling `GET /api/merchant/stats` (returns KPI data) and `GET /api/merchant/bookings` (returns all bookings with optional query params for flow/status filters). Also wraps `POST /api/orders/:id/capture` (capture balance), `POST /api/orders/:id/void` (void auth), `POST /api/vault/charge` (charge add-on), and `DELETE /api/vault/:token` (delete vault).
**Acceptance:**
- Stats response decodes into `MerchantStats` model (activeBookings, pendingCaptures, openInvoices, monthlyRevenue)
- All merchant action endpoints return updated booking state
- Error responses mapped to `APIError` for banner display

### 6.2 MerchantHomeView with KPI Cards
**Files:** `Views/Merchant/MerchantHomeView.swift`, `Models/MerchantStats.swift`
**Dependencies:** 6.1, Section 1 (TerraCard)
**Output:** 2x2 LazyVGrid of KPI cards: Active Bookings, Pending Captures, Open Invoices, Monthly Revenue. Each card shows SF Symbol icon, value, and label. Below KPIs: "Recent Bookings" section with last 5 bookings as compact rows. This view appears at top of Bookings tab when `authStore.role == .merchant`.
**Acceptance:**
- KPI cards use TerraCard with terracotta icon tint
- Revenue card formats as currency ($X,XXX)
- Tap on a recent booking navigates to MerchantBookingDetailView
- Loading state shows `.redacted(reason: .placeholder)` skeleton

### 6.3 MerchantBookingListView with Filters
**Files:** `Views/Merchant/MerchantBookingListView.swift`
**Dependencies:** 6.1, 5.2
**Output:** Full booking list below MerchantHomeView KPIs. Horizontal ScrollView of filter chips: All | Authorize | Vault | Invoice | Instant (flow filter) and status filter: All | Pending | Completed. Each row shows customer name, trip name, ref, StatusBadge, amount. Pull-to-refresh support.
**Acceptance:**
- Filter chips use segmented/pill style with terracotta active state
- Filters applied client-side on the fetched bookings array
- Tap navigates to MerchantBookingDetailView

### 6.4 MerchantBookingDetailView
**Files:** `Views/Merchant/MerchantBookingDetailView.swift`
**Dependencies:** 6.1, 5.4, Section 1 (TerraCard, InfoRow, StatusBadge)
**Output:** "Merchant View" badge at top. Customer info card (initials avatar, name, email). Trip/rental/cruise info card. Payment status card with flow-specific content:
- Flow 1: auth status, auth ID, countdown, progress bar, "Capture Balance" and "Void Authorization" buttons (per authorize-flow screen 7)
- Flow 2: vault status, charge history table, "Charge Add-on" and "Final Settlement" buttons
- Flow 3: invoice status, invoice link, "Resend Invoice" button
- Flow 4: capture status, "Issue Refund" button (per car-rental/cruise screen 7)
Destructive actions use `.confirmationDialog` before execution.
**Acceptance:**
- Matches all 3 storyboard screen 7 merchant layouts
- Confirmation dialogs block accidental destructive actions
- After successful action, view refreshes with updated booking state and haptic feedback (`.notification(.success)`)

### 6.5 CaptureBalanceView (Flow 1)
**Files:** `Views/Merchant/CaptureBalanceView.swift`
**Dependencies:** 6.1, 6.4
**Output:** Full-screen pushed view (not sheet) showing: booking summary card (thumbnail + ref + trip name), capture details card (auth ID, amount to capture in large terracotta text, customer name), warning callout ("This will charge the customer's PayPal account $X"), "Confirm Capture" primary button, "Cancel" ghost button. After success: inline success card with checkmark, "Balance Captured Successfully", total collected, "Booking Completed" badge. Matches authorize-flow screen 8.
**Acceptance:**
- Amount to capture = totalPrice - depositAmount
- Success state replaces action buttons with completion card
- Haptic feedback on successful capture (`.notification(.success)`)
- Back navigation returns to updated MerchantBookingDetailView

### 6.6 ChargeAddonSheet (Flow 2)
**Files:** `Views/Merchant/ChargeAddonSheet.swift`
**Dependencies:** 6.1
**Output:** `.sheet` presentation with: preset amount chips ("Travel Insurance $50", "Excursion $75", "Spa Package $30"), custom amount TextField with currency formatting, description TextField, "Charging to" customer info row, primary "Charge" button. Uses `POST /api/vault/charge` with stored vault token.
**Acceptance:**
- Preset chips populate amount and description fields on tap
- Custom amount validates as positive number > 0
- Sheet dismisses on successful charge with haptic feedback
- Parent view (MerchantBookingDetailView) refreshes charge history

---

## Section 7: Polish & Testing (5 tasks)

### 7.1 Skeleton Loading States
**Files:** All list/detail views (modifications, not new files)
**Dependencies:** Sections 3-6 complete
**Output:** Add `.redacted(reason: .placeholder)` modifier to: ExploreTabView (trip cards), BookingListView (booking cards), MerchantHomeView (KPI cards), BookingDetailView (detail sections). Show skeleton while `isLoading == true` on respective stores. Use placeholder data arrays (3-5 items) for realistic skeleton shapes.
**Acceptance:**
- Skeletons appear immediately on first load (no blank screen flash)
- Skeleton shapes match final content layout (card heights, text line widths)
- Transition from skeleton to real content is smooth (no layout jump)

### 7.2 ErrorBanner & Retry Pattern
**Files:** `Views/Shared/ErrorBanner.swift`, modifications to all views with API calls
**Dependencies:** Section 1 (APIClient error types)
**Output:** Sticky banner component at top of scrollable content with red/warning background, error message text, "Retry" button. Retry re-invokes the failed async call. Add ErrorBanner to: ExploreTabView, BookingListView, BookingDetailView, MerchantHomeView, MerchantBookingDetailView, all checkout views. Dismissable with swipe or X button.
**Acceptance:**
- Banner animates in from top (`.transition(.move(edge: .top))`)
- Retry button calls the original failed function
- Banner auto-dismisses after 8 seconds if not interacted with
- Network errors show "No internet connection" with distinct icon

### 7.3 Haptics & Interaction Polish
**Files:** Modifications across payment/merchant views
**Dependencies:** Sections 4-6 complete
**Output:** Add haptic feedback: `.impact(.medium)` on PayPal button tap, `.notification(.success)` on payment confirmation and merchant actions (capture/charge/void), `.notification(.error)` on payment failure. Add subtle button scale animation on press (`.scaleEffect` with `.animation`). Ensure all interactive elements meet 44pt minimum touch target.
**Acceptance:**
- Haptics fire at correct moments (not on loading, only on user-triggered outcomes)
- No haptic on cancel/dismiss (voluntary exit)
- All buttons, cards, and tappable rows verified >= 44pt hit area

### 7.4 Dynamic Type & iPad Layout Verification
**Files:** Modifications as needed across all views
**Dependencies:** All sections complete
**Output:** Verify all text respects Dynamic Type scaling without truncation or overlap. Test at accessibility sizes (AX1-AX5). Verify iPad NavigationSplitView: sidebar shows tab items, detail column shows content, compact width falls back to TabView. Fix any clipping, overlapping, or broken layouts found during testing. Ensure safe area compliance on all fixed elements (tab bar, processing overlay).
**Acceptance:**
- No text truncation at AX3 Dynamic Type size
- iPad landscape shows sidebar + detail split correctly
- iPad portrait collapses to single-column appropriately
- Processing overlay respects safe areas and Dynamic Island

### 7.5 E2E PayPal Sandbox Testing & Debug Settings
**Files:** `Views/Profile/DebugSettingsView.swift`, modifications to `Services/APIClient.swift`
**Dependencies:** All sections complete
**Output:** Debug settings screen accessible from Profile tab (only in `#if DEBUG`): base URL override TextField (stored in UserDefaults), current user/role display, "Reset All Data" button. Run end-to-end tests for all 4 flows against PayPal sandbox: Flow 1 (authorize deposit > capture balance), Flow 2 (vault setup > charge add-on > final settlement), Flow 3 (submit request > verify invoice creation), Flow 4 (instant capture for car rental and cruise). Document test results.
**Acceptance:**
- Base URL override persists across app restarts and takes effect on next API call
- All 4 PayPal flows complete successfully end-to-end with sandbox credentials
- Payment amounts match between checkout, confirmation, and booking detail views
- Merchant actions (capture/void/charge/refund) execute correctly against sandbox
