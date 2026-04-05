# TERRA iOS — Implementation Plan

> **Spec:** `ios/docs/superpowers/specs/2026-04-05-terra-ios-app-design.md`
> **Test Cases:** `ios/docs/test-cases.md` (~110 tests)
> **Total:** 49 tasks across 7 sections
> **Approach:** Native SwiftUI, iOS 17+, shared Express backend, PayPal iOS SDK
> **Methodology:** TDD — write failing tests first, then minimal code to pass, then refactor

### TDD Workflow Per Task
1. **Write test(s)** from `test-cases.md` for the current task
2. **Run tests** — verify they FAIL (red)
3. **Write minimal production code** to make tests pass
4. **Run tests** — verify they PASS (green)
5. **Refactor** if needed — keep tests green
6. **Mark task complete** in `todos.md`

### Test Infrastructure (create before Task 1.1)
- Add `trip-iosTests` target with `SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor` matching app target
- Create `Tests/Mocks/MockHTTPClient.swift` — protocol-based mock (NOT URLProtocol — broken under Swift 6 MainActor)
- Create `Tests/Fixtures/` with JSON fixture files (trips.json, booking.json, etc.)
- Use `UserDefaults(suiteName: "test-\(UUID())")` for store tests with `UserDefaults.standard.removePersistentDomain` cleanup
- Use `ModelConfiguration(isStoredInMemoryOnly: true)` for SwiftData tests

### Key Learnings (from implementation)
- **Naming:** Avoid `Tab` — collides with SwiftUI iOS 18. Use `TerraTab`.
- **Mocking:** `URLProtocol` subclasses don't work with `SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor`. Use `HTTPDataProvider` protocol + `MockHTTPClient` instead.
- **Sendable:** `Error` is not `Sendable`. Store error descriptions as `String` in `Sendable` enums.
- **API contracts:** Always verify field names against server routes. `JSONEncoder` sends Swift property names as-is (no auto snake_case). `JSONDecoder` with `.convertFromSnakeCase` only applies to decoding.
- **Asset Catalog:** Does NOT support WebP. Convert to JPEG before adding to imagesets.
- **PayPal SDK:** Button components are UIKit-based (`UIViewRepresentable`). `PayPalMessageOfferType` cases: `.payLaterShortTerm`, `.payLaterLongTerm`, `.payLaterPayIn1` — no `.payLaterPayIn4`.
- **Trip images:** Map slug → asset name `"trip-\(slug)"`. Images from web app's `client/public/` converted to JPEG.
- **Itemized fees:** `Trip.feeBreakdown` provides mockup `[(item, amount)]` per slug summing to `basePrice`. Generic fallback for unmapped slugs. Shown in detail + checkout views.
- **Car rental pricing:** InstantCheckoutView computes `days x dailyRate + 8% tax`. Receives `pickupDate/dropoffDate` via `NavigationDestination.checkout(slug:pickupDate:dropoffDate:)`.
- **Checkout images:** All checkout order summary cards use `trip.hasImage` + `Image(trip.imageName)` with gradient fallback.

---

## Section 1: Project Foundation & Theme (8 tasks)

> Prerequisite: Fresh Xcode project exists at `trip-ios/` with default `trip_iosApp.swift` and `ContentView.swift`.

### Task 1.1: Create Folder Structure

**Files to create:** Empty directories matching the design spec architecture.

```
trip-ios/trip-ios/
  Theme/
  Models/
  Services/
  Stores/
  Views/Explore/Checkout/
  Views/Bookings/
  Views/Merchant/
  Views/Profile/
  Views/Shared/
  Views/Components/
  Extensions/
```

**Output:** All group folders exist in the Xcode project navigator.
**Dependencies:** None.
**Acceptance:** Project builds with no errors. Folders visible in Xcode navigator.

### Task 1.2: Bundle Inter Font

**Files:** Download `Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf` from Google Fonts. Add to `trip-ios/trip-ios/Fonts/`. Register in `Info.plist` under `UIAppFonts`. Add to "Copy Bundle Resources" build phase.

**Output:** `UIFont(name: "Inter-SemiBold", size: 16)` returns non-nil at runtime.
**Dependencies:** None.
**Acceptance:** Preview renders Inter text visibly different from San Francisco.

### Task 1.3: TerraColors — Color Palette

**File:** `Theme/TerraColors.swift`
**Contents:** `Color` extension with hex initializer + 12 static constants (WCAG AA verified):
- Core: `terraMocha` (#5C3D2E), `terraTerracotta` (#A0522D), `terraSage` (#86A873 — fills only), `terraAlpineOat` (#FAF6F1), `terraIvory` (#FFFDF9), `terraBorder` (#E8DFD4), `terraText` (#3D2B1F), `terraDestructive` (#DC2626)
- Contrast-safe text variants: `terraSageText` (#5D8A48 — 4.58:1), `terraTextMuted` (#7A6347 — darkened from #8B7355, 5.0:1), `terraWarning` (#B8860B — fills only), `terraWarningText` (#8B6508 — 4.65:1)

**Usage rules:** `terraSage`/`terraWarning` for badge backgrounds only, never as text. Use `terraSageText`/`terraWarningText` for text labels.
**Dependencies:** None.
**Acceptance:** `Color.terraTerracotta` compiles. All text colors pass 4.5:1 contrast on AlpineOat/Ivory backgrounds.

### Task 1.4: TerraTypography — Font Styles

**File:** `Theme/TerraTypography.swift`
**Contents:** `Font` extension with 6 levels: `terraLargeTitle` (Inter-Bold 28pt), `terraTitle` (Inter-SemiBold 22pt), `terraHeadline` (Inter-SemiBold 16pt), `terraBody` (SF 14pt), `terraCaption` (SF 12pt), `terraFootnote` (SF 11pt — bumped from 10pt for contrast compliance).
**Dependencies:** Task 1.2.
**Acceptance:** Preview confirms headings in Inter, body in SF.

### Task 1.5: TerraSpacing — Spacing Scale

**File:** `Theme/TerraSpacing.swift`
**Contents:** Enum with constants: `xxs=4, xs=8, sm=12, md=16, lg=20, xl=24, xxl=32, xxxl=48, cardPadding=16, sectionSpacing=24, screenEdge=16, screenEdgeIPad=20`.
**Dependencies:** None.
**Acceptance:** Usable in `.padding(TerraSpacing.md)`.

### Task 1.6: Shared Components — TerraCard, TerraButton, StatusBadge, InfoRow, SectionHeader

**Files:** `Views/Components/TerraCard.swift`, `TerraButton.swift`, `StatusBadge.swift`, `InfoRow.swift`, `SectionHeader.swift`

- **TerraCard:** terraIvory bg, 12pt radius, shadow (black 0.06, radius 4, y 2), `@ViewBuilder content`.
- **TerraButton:** 4 variants (primary/outline/destructive/ghost), `isLoading` support, 44pt min height.
- **StatusBadge:** Capsule pill with icon + text (not color alone — WCAG). Mappings: checkmark + sage bg / sageText (completed), clock + warning bg / warningText (pending), circle + blue (active), building + purple (merchant). All text uses contrast-safe color variants.
- **InfoRow:** HStack label-value with muted label, optional SF Symbol.
- **SectionHeader:** terraTitle font + sectionSpacing top padding.

**Dependencies:** Tasks 1.3, 1.4, 1.5.
**Acceptance:** Each has `#Preview` block. TerraButton >= 44pt tall.

### Task 1.7: PayPalButton Component

**File:** `Views/Components/PayPalButton.swift`
**Contents:** Yellow (#FFC439) button, dark text (#253B80), 24pt radius, 50pt height, `isLoading` support, disabled opacity 0.6.
**Dependencies:** Task 1.3.
**Acceptance:** Preview shows branded PayPal button. Loading shows spinner.

### Task 1.8: APIClient — Base Networking Layer

**File:** `Services/APIClient.swift`
**Contents:** `actor APIClient` with configurable `baseURL` (default localhost:3001, overridable via UserDefaults), `X-User-Role` header, generic `request<T: Decodable>(method:path:body:)`, `HTTPMethod` enum, `APIError` enum (networkError, serverError, decodingError), 30s timeout, snake_case decoding.
**Dependencies:** None.
**Acceptance:** Generic request compiles. Error descriptions are human-readable.

---

## Section 2: Auth, Navigation Shell & Profile (6 tasks)

> Depends on: Section 1

### Task 2.1: User Model

**File:** `Models/User.swift`
**Output:** `User` struct (Codable, Identifiable): id, name, email, `avatarInitials` (computed). `UserRole` enum (`.customer`, `.merchant`) with raw values matching server headers.
**Dependencies:** None.
**Acceptance:** Round-trips through JSONEncoder/Decoder.

### Task 2.2: AuthStore

**File:** `Stores/AuthStore.swift`
**Output:** `@Observable class AuthStore` with `currentUser`, `role`, `isLoggedIn` (computed), `selectedTab`, `navigationPaths: [Tab: NavigationPath]`. Methods: `login(user:role:)`, `logout()`, `switchRole(_:)`. Role switch resets all paths and sets tab to `.home`. Persists to UserDefaults.
**Dependencies:** Tasks 2.1, 2.3.
**Acceptance:** Role switch clears all paths. State survives relaunch.

### Task 2.3: Tab Enum & NavigationDestination

**File:** `App/ContentView.swift` (enum declarations)
**Output:** `Tab` enum (.home, .search, .bookings, .profile) with SF Symbol + label. `NavigationDestination` enum with cases: `.tripDetail(slug)`, `.checkout(slug)`, `.bookingDetail(id)`, `.merchantBookingDetail(id)`.
**Dependencies:** None.
**Acceptance:** `Tab.allCases` returns 4 tabs. All destinations are Hashable.

### Task 2.4: LoginView

**File:** `Views/Profile/LoginView.swift`
**Output:** Picker with pre-seeded users, "Login as Customer" / "Login as Merchant" buttons, TERRA branding header.
**Dependencies:** Tasks 2.1, 2.2, Section 1.
**Acceptance:** Login sets role and navigates to Home tab.

### Task 2.5: ProfileView with Role Switcher

**File:** `Views/Profile/ProfileView.swift`
**Output:** Initials avatar, name, email, segmented Picker for role, logout button. Shows LoginView when not logged in.
**Dependencies:** Tasks 2.2, 2.4.
**Acceptance:** Role switch resets navigation. Logout returns to LoginView.

### Task 2.6: ContentView — TabView + NavigationStack + iPad

**File:** `App/ContentView.swift`
**Output:** iPhone: `TabView` with 4 tabs, each with `NavigationStack(path:)`. iPad: `NavigationSplitView` with sidebar. Placeholder views for Home/Search/Bookings. AuthStore injected via `.environment()` in TerraApp.
**Dependencies:** Tasks 2.2, 2.3, 2.5.
**Acceptance:** All tabs work on iPhone. iPad shows sidebar + detail. Role switch resets stacks.

---

## Section 3: Trip Browsing — Explore & Search (7 tasks)

> Depends on: Sections 1, 2

### Task 3.1: Trip Model & SwiftData Schema

**File:** `Models/Trip.swift`
**Output:** `Trip` and `ItineraryDay` structs: Codable + `@Model`. Fields: slug, name, category (enum), description, imageURL, price, depositAmount?, duration, paymentFlow (enum), included, itinerary, specs (optional JSON for car/cruise data).
**Dependencies:** None.
**Acceptance:** Decodes from `/api/trips` JSON. SwiftData persists and queries.

### Task 3.2: TripService

**File:** `Services/TripService.swift`
**Output:** `fetchTrips()` and `fetchTrip(slug:)` via APIClient.
**Dependencies:** Tasks 1.8, 3.1.
**Acceptance:** Returns decoded Trip arrays/objects. Errors propagate as APIError.

### Task 3.3: TripStore with SwiftData Caching

**File:** `Stores/TripStore.swift`
**Output:** `@Observable` with trips, selectedCategory, isLoading, error. Loads cache on init, fetches API in background, upserts. `filteredTrips` computed property. Pull-to-refresh support.
**Dependencies:** Tasks 3.1, 3.2.
**Acceptance:** Cached trips show instantly. Category switch filters without re-fetch. Pull-to-refresh updates cache.

### Task 3.4: ExploreTabView & TripListView

**Files:** `Views/Explore/ExploreTabView.swift`, `TripListView.swift`
**Output:** Segmented control (Tours/Car Rentals/Cruises), LazyVGrid (1-col iPhone, 2-col iPad), skeleton loading, empty state, pull-to-refresh.
**Dependencies:** Tasks 3.3, 1.6.
**Acceptance:** Category switch updates grid. Adaptive columns. Loading shows skeletons.

### Task 3.5: TripCardView

**File:** `Views/Explore/TripCardView.swift`
**Output:** Card with AsyncImage + gradient overlay, name, price, duration badge (top-right), payment flow badge (top-left). Category-specific layouts (gradient for tours/cruises, plain for cars). Tap navigates to detail.
**Dependencies:** Tasks 3.1, 1.6.
**Acceptance:** Renders correctly for all 3 categories. Badges display correct labels.

### Task 3.6: TripDetailView with Category-Specific Layouts

**File:** `Views/Explore/TripDetailView.swift`
**Output:** Hero image with parallax, info chips, then category-specific sections:
- **Tour:** Day-by-day itinerary, "What's Included", fee schedule, authorize info callout, "Reserve with Deposit" CTA.
- **Car:** Spec grid (4 items), date pickers, computed total, price summary, "Continue to Checkout" CTA.
- **Cruise:** Cabin segmented selector, port itinerary, includes chips, price breakdown, "Book Now" CTA.

CTA pushes to CheckoutRouter.
**Dependencies:** Tasks 3.1, 3.2, 1.6.
**Reference:** Storyboard screens 1-2 for all 3 flows.
**Acceptance:** Parallax works. Each category renders unique sections. Car date picker updates price. Cruise cabin selector updates breakdown.

### Task 3.7: SearchView

**File:** `Views/Explore/SearchView.swift`
**Output:** TextField with 300ms debounce, category filter chips, filtered results as TripCardView list, empty state. Own NavigationStack.
**Dependencies:** Tasks 3.3, 3.5.
**Acceptance:** Debounced filtering works. Category chips narrow results. Independent nav stack.

---

## Section 4: Payment Flows — Checkout & PayPal (10 tasks)

> Depends on: Sections 1, 3

### Task 4.1: OrderService, VaultService, InvoiceService

**Files:** `Services/OrderService.swift`, `VaultService.swift`, `InvoiceService.swift`
**Output:**
- OrderService: `createOrder`, `authorizeOrder`, `captureOrder`
- VaultService: `chargeVault`, `deleteVault`
- InvoiceService: `createTripRequest`, `createInvoice`, `sendInvoice`, `pollInvoiceStatus` (5s interval, max 60 retries)

**Dependencies:** Task 1.8.
**Acceptance:** All methods compile with async/await and typed responses.

### Task 4.2: PayPalManager Singleton

**Files:** `Services/PayPalManager.swift`, `App/TerraApp.swift`, `Info.plist`
**Output:** Add PayPalCheckout SPM. Configure SDK in TerraApp init. Register `terra-ios` URL scheme. `@Observable PayPalManager` with `startCheckout(tripSlug:intent:extras:)`, `onCancel` (silent dismiss), `onError` (set error for banner).
**Dependencies:** Task 4.1.
**Acceptance:** SDK initializes. startCheckout compiles with callbacks. URL scheme registered.

### Task 4.3: CheckoutRouter

**File:** `Views/Explore/Checkout/CheckoutRouter.swift`
**Output:** Switches on `trip.paymentFlow` to dispatch to correct checkout view. Manages `showProcessing` and `showConfirmation` state.
**Dependencies:** Section 3.
**Acceptance:** All 4 branches render correct view. Unknown flow shows error fallback.

### Task 4.4: ProcessingOverlay

**File:** `Views/Shared/ProcessingOverlay.swift`
**Output:** Dimmed overlay + centered white card with spinner + "Processing Payment..." + "Please don't close this screen". Blocks all interaction and swipe-back (`.navigationBarBackButtonHidden(true)` + `.interactiveDismissDisabled(true)` when visible). Spring animation entrance (`.spring(response: 0.35, dampingFraction: 0.85)`). Respects `@Environment(\.accessibilityReduceMotion)` — instant show if reduced.
**Dependencies:** Section 1.
**Acceptance:** Overlay centered, blocks taps and swipe-back, animates with spring curve.

### Task 4.5: ConfirmationView

**File:** `Views/Shared/ConfirmationView.swift`
**Output:** `.fullScreenCover` with sage checkmark, title, TERRA-XXXX ref, flow-specific details card, step indicator (Flow 1), "View My Bookings" CTA (dismisses + switches to Bookings tab), "Back to Home" ghost button.
**Dependencies:** Section 1, Task 4.1.
**Acceptance:** Correct content for all 4 flows. CTA navigates to Bookings tab.

### Task 4.6: AuthorizeCheckoutView (Flow 1)

**File:** `Views/Explore/Checkout/AuthorizeCheckoutView.swift`
**Output:** Order summary, fee breakdown (deposit bold / balance muted / total), info callout, PayPal button (AUTHORIZE intent), "Pay Later" link, terms text. ProcessingOverlay during auth. Confirmation on success.
**Dependencies:** Tasks 4.2-4.5.
**Reference:** `trip-authorize-flow.html` screen 3.
**Acceptance:** Layout matches storyboard. PayPal triggers SDK. Processing overlay appears. Confirmation on success. PayPal button disables immediately on tap (prevents double-tap/duplicate orders). No pull-to-refresh on this screen.

### Task 4.7: VaultCheckoutView (Flow 2)

**File:** `Views/Explore/Checkout/VaultCheckoutView.swift`
**Output:** Order summary, "How It Works" 3-step card, fee breakdown, info callout, PayPal button (CAPTURE + vault extras). No Pay Later. Confirmation shows vault status.
**Dependencies:** Tasks 4.2-4.5.
**Acceptance:** Vault extras passed correctly. Confirmation shows vault messaging.

### Task 4.8: InstantCheckoutView (Flow 4)

**File:** `Views/Explore/Checkout/InstantCheckoutView.swift`
**Output:** Order summary, trip details (car dates or cruise cabin), price breakdown, PayPal button (CAPTURE), Pay Later button + installment messaging, secure checkout badge.
**Dependencies:** Tasks 4.2-4.5, 4.10.
**Reference:** `car-rental-flow.html` screen 3, `cruise-booking-flow.html` screen 3.
**Acceptance:** Adapts for car vs cruise. Pay Later renders. Full capture works E2E.

### Task 4.9: InvoiceRequestView (Flow 3)

**File:** `Views/Explore/Checkout/InvoiceRequestView.swift`
**Output:** Multi-select destinations, activities with prices, date picker, notes TextEditor, "Submit Request" button. No PayPal SDK. Server creates trip request + invoice.
**Dependencies:** Tasks 4.1, 4.3, 4.5.
**Acceptance:** Form validates required fields. Submit creates request and invoice. Confirmation shows invoice messaging. "Submit" button disables on tap to prevent duplicates. Keyboard: `.scrollDismissesKeyboard(.interactively)` + "Done" toolbar button.

### Task 4.10: PayLaterMessage Component

**File:** `Views/Shared/PayLaterMessage.swift`
**Output:** Two styles: `.full` (button + "Pay in 4 of $X" text) for Flow 4, `.link` (text-only) for Flow 1. Not shown for Flows 2, 3.
**Dependencies:** Section 1.
**Acceptance:** Installment math correct (total/4, 2 decimals). "Learn more" opens SFSafariViewController.

---

## Section 5: Customer Bookings (5 tasks)

> Depends on: Sections 1, 2, 4

### Task 5.1: BookingService & BookingStore

**Files:** `Services/BookingService.swift`, `Stores/BookingStore.swift`
**Output:** Service: `fetchBookings()`, `fetchBooking(id:)`. Store: `@Observable` with bookings, isLoading, error. Always fetch fresh (no SwiftData).
**Dependencies:** Section 1.
**Acceptance:** Decodes all 4 flow types. Pull-to-refresh works.

### Task 5.2: BookingCardView

**File:** `Views/Bookings/BookingCardView.swift`
**Output:** Row card: trip thumbnail, name, TERRA-XXXX ref, StatusBadge, date, amount. TerraCard container, 44pt min tap target.
**Dependencies:** Tasks 5.1, 1.6.
**Acceptance:** Matches storyboard list row style. Correct badge colors.

### Task 5.3: BookingListView & EmptyStateView

**Files:** `Views/Bookings/BookingListView.swift`, `Views/Shared/EmptyStateView.swift`
**Output:** ScrollView + pull-to-refresh, BookingCardView rows, tap navigates to detail. EmptyStateView: illustration, "No bookings yet", "Explore Trips" CTA (switches to Home tab).
**Dependencies:** Tasks 5.1, 5.2.
**Acceptance:** Pull-to-refresh reloads. Empty state shows when no bookings. Navigation via NavigationLink(value:).

### Task 5.4: PaymentTimeline Component

**File:** `Views/Shared/PaymentTimeline.swift`
**Output:** Reusable vertical timeline: sage dots (done), gray dots (pending), connecting lines. Accepts `[TimelineStep]`. Flow-specific renderings: Flow 1 (deposit→capture→balance), Flow 2 (setup→add-ons→settlement), Flow 3 (request→invoice→paid), Flow 4 (single capture).
**Dependencies:** Section 1.
**Acceptance:** Renders correctly for all 4 flows. Supports Dynamic Type. 20px dots, 2px lines.

### Task 5.5: BookingDetailView

**File:** `Views/Bookings/BookingDetailView.swift`
**Output:** Header (ref + badge), trip info card, PaymentTimeline, progress bar (amountPaid/total), PayPal order details card, Flow 1 countdown ("X days remaining"), Flow 2 charges table + "Remove Saved Payment".
**Dependencies:** Tasks 5.1, 5.4, 1.6.
**Reference:** All storyboard screen 6.
**Acceptance:** Progress bar matches ratio. Countdown calculates from 29-day window. Flow-specific sections render conditionally.

---

## Section 6: Merchant Features (6 tasks)

> Depends on: Sections 1, 2, 5

### Task 6.1: MerchantService

**File:** `Services/MerchantService.swift`
**Output:** `fetchStats()` → MerchantStats, `fetchAllBookings(flow:status:)`, `captureBalance(orderId:)`, `voidAuth(orderId:)`, `chargeAddon(token:amount:description:)`, `deleteVault(token:)`.
**Dependencies:** Task 1.8.
**Acceptance:** Stats decode into MerchantStats. Action endpoints return updated state.

### Task 6.2: MerchantHomeView with KPI Cards

**Files:** `Views/Merchant/MerchantHomeView.swift`, `Models/MerchantStats.swift`
**Output:** 2x2 LazyVGrid of KPI cards (Active Bookings, Pending Captures, Open Invoices, Monthly Revenue). Below: "Recent Bookings" (last 5). Appears at top of Bookings tab when merchant role.
**Dependencies:** Task 6.1, 1.6.
**Acceptance:** Revenue formatted as currency. Tap recent booking navigates to detail. Skeleton on loading.

### Task 6.3: MerchantBookingListView with Filters

**File:** `Views/Merchant/MerchantBookingListView.swift`
**Output:** Horizontal filter chips (flow + status), booking rows (customer, trip, ref, badge, amount), pull-to-refresh. Client-side filtering.
**Dependencies:** Tasks 6.1, 5.2.
**Acceptance:** Filters work. Tap navigates to MerchantBookingDetailView.

### Task 6.4: MerchantBookingDetailView

**File:** `Views/Merchant/MerchantBookingDetailView.swift`
**Output:** "Merchant View" badge, customer card, trip card, payment status card with flow-specific actions:
- Flow 1: auth status, countdown, progress, "Capture Balance" / "Void" buttons
- Flow 2: vault status, charges history, "Charge Add-on" / "Final Settlement" buttons
- Flow 3: invoice status/link, "Resend Invoice" button
- Flow 4: capture status, "Issue Refund" button

`.confirmationDialog` for destructive actions. Haptic on success.
**Dependencies:** Tasks 6.1, 5.4, 1.6.
**Reference:** All storyboard screen 7.
**Acceptance:** Matches storyboard layouts. Confirmation blocks accidents. Refreshes after action.

### Task 6.5: CaptureBalanceView (Flow 1)

**File:** `Views/Merchant/CaptureBalanceView.swift`
**Output:** Full-screen pushed view: booking summary, capture details (amount in large terracotta), warning callout, "Confirm Capture" + "Cancel" buttons. After success: inline completion card with checkmark + "Booking Completed" badge.
**Dependencies:** Task 6.1.
**Reference:** `trip-authorize-flow.html` screen 8.
**Acceptance:** Amount = total - deposit. Success replaces buttons with completion card. Haptic on success.

### Task 6.6: ChargeAddonSheet (Flow 2)

**File:** `Views/Merchant/ChargeAddonSheet.swift`
**Output:** `.sheet` with preset amount chips ("Travel Insurance $50", "Excursion $75", "Spa Package $30"), custom amount field, description field, customer info row, "Charge" button. Uses `POST /api/vault/charge`.
**Dependencies:** Task 6.1.
**Acceptance:** Presets populate fields. Custom amount validates > 0. Sheet dismisses on success with haptic. Parent refreshes. `.interactiveDismissDisabled` when form has unsaved input — shows confirmation dialog before discarding.

---

## Section 7: Polish, Accessibility & Testing (7 tasks)

> Depends on: All sections complete

### Task 7.1: Skeleton Loading States

**Files:** Modifications to ExploreTabView, BookingListView, MerchantHomeView, BookingDetailView
**Output:** `.redacted(reason: .placeholder)` with placeholder data arrays (3-5 items). Show while `isLoading == true`.
**Acceptance:** Skeletons appear instantly. Shapes match final layout. Smooth transition to real content.

### Task 7.2: ErrorBanner & Retry Pattern

**Files:** `Views/Shared/ErrorBanner.swift`, modifications to all API-calling views
**Output:** Sticky banner with error message + "Retry" button. Animates in from top (`.transition(.move(edge: .top))`). Auto-dismiss after 8s. Network errors show distinct icon ("wifi.slash"). Posts `UIAccessibility.post(notification: .announcement)` when appearing for VoiceOver.
**Acceptance:** Retry re-invokes failed call. Banner animatable and dismissable. VoiceOver announces error message.

### Task 7.3: Haptics & Touch Target Verification

**Files:** Modifications across payment/merchant views
**Output:** `.impact(.medium)` on PayPal tap, `.notification(.success)` on confirmations, `.notification(.error)` on failures. Subtle scale animation on button press (`.scaleEffect(0.97)` on press, restore on release). Verify all tappables >= 44pt. Scale animation disabled when `accessibilityReduceMotion` is on.
**Acceptance:** Haptics at correct moments. No haptic on cancel. All targets >= 44pt.

### Task 7.4: Accessibility — VoiceOver & Reduce Motion

**Files:** Modifications across all views
**Output:**
- `.accessibilityLabel` on: all icon-only buttons (back, close, filter), AsyncImage trip photos (trip name + category), StatusBadge (status text), payment flow badges, PayPal button ("Pay with PayPal"), tab bar icons.
- StatusBadge already has icon + text (Task 1.6) — verify color is never the sole indicator.
- Check `@Environment(\.accessibilityReduceMotion)`: disable parallax hero scroll in TripDetailView, stagger animation in TripListView, button scale animation. Keep ProcessingOverlay spinner (functional, not decorative).
- Verify `.accessibilityHint` on merchant action buttons (e.g., "Double-tap to capture the remaining balance").
**Dependencies:** All sections.
**Acceptance:** VoiceOver navigation works logically through all screens. No unlabeled interactive elements. Reduce motion disables all decorative animation.

### Task 7.5: Dynamic Type & iPad Layout Verification

**Files:** Modifications as needed
**Output:** Verify Dynamic Type at AX1-AX5 without truncation (minimum text 11pt). iPad: NavigationSplitView works in landscape + portrait. Processing overlay respects safe areas + Dynamic Island. Test ChargeAddonSheet on iPad (`.formSheet` presentation).
**Acceptance:** No truncation at AX3. iPad layout correct in both orientations. All text >= 11pt.

### Task 7.6: Animation Polish

**Files:** Modifications to TripListView, TripDetailView, ProcessingOverlay, ConfirmationView
**Output:**
- Stagger trip card entrance: 30-50ms delay per item via `.transition(.opacity.combined(with: .move(edge: .bottom)))` with index-based delay.
- Hero image shared transition: `.matchedGeometryEffect(id: trip.slug, in: namespace)` between TripCardView and TripDetailView hero.
- Spring curves for modal transitions: `.spring(response: 0.35, dampingFraction: 0.85)`.
- Tab badge on Bookings tab: `.badge(pendingCount)` showing count of pending captures/invoices.
- All animations gated on `!accessibilityReduceMotion`.
**Dependencies:** Tasks 3.4, 3.5, 3.6, 4.4, 4.5.
**Acceptance:** Card entrance staggers visually. Hero image zooms from card to detail. Modals use spring physics. Badge count updates on booking changes.

### Task 7.7: E2E PayPal Sandbox Testing & Debug Settings

**Files:** `Views/Profile/DebugSettingsView.swift`, APIClient modification
**Output:** Debug screen (Profile tab, `#if DEBUG` only): base URL override TextField (persisted in UserDefaults), current user/role display, "Reset All Data" button. Search tab empty state: "Recent Searches" (UserDefaults, max 5) + "Popular Destinations" suggestions. Test all 4 flows E2E against PayPal sandbox. Document results.
**Acceptance:** Base URL persists and takes effect. All 4 flows complete E2E. Amounts match across screens. "View My Bookings" from confirmation scrolls to new booking + triggers refresh.

---

## Task Dependency Graph

```
Section 1 (Foundation) ─┬─> Section 2 (Auth & Nav) ─┬─> Section 3 (Browsing) ─> Section 4 (Payments)
                         │                           │                                    │
                         │                           └─> Section 5 (Bookings) <───────────┘
                         │                                       │
                         └───────────────────────────> Section 6 (Merchant) <─── Section 5
                                                                 │
                                                      Section 7 (Polish) <─── All
```

Sections 3 and 5 can partially overlap. Section 7 runs last.
