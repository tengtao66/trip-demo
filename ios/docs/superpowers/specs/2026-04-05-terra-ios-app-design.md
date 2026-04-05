# TERRA iOS App — Design Spec

## Overview

Native SwiftUI iOS app for the TERRA trip booking demo. Connects to the existing Express backend, implements all 4 PayPal payment flows, and provides both customer and lite-merchant experiences. Targets iOS 17+ on iPhone and iPad.

## Scope

### In Scope
- Customer: browse trips (tours/car rentals/cruises), view details, book via 4 payment flows, view bookings
- Merchant (lite): KPI summary, booking list with filters, booking detail with capture/void/charge actions
- Role switching (customer ↔ merchant) via Profile tab
- PayPal iOS SDK for native checkout
- iPad adaptive layout via NavigationSplitView
- Shared backend — same Express server and SQLite database as the web app

### Out of Scope
- Full merchant dashboard charts (Recharts equivalent) — show KPI cards only
- Simulation panel (merchant-only testing tool)
- Dark mode (web app doesn't have it either — can add later)
- Push notifications
- Offline-first with sync (read-only caching only)

---

## Architecture

### Tech Stack
- **SwiftUI** (iOS 17+) — declarative UI framework
- **Swift 6** — strict concurrency, async/await
- **Observation framework** (`@Observable` macro) — state management
- **SwiftData** — local caching for trips (offline browsing)
- **PayPal iOS SDK** — native checkout via SPM
- **URLSession** — async/await networking

### Project Structure
```
trip-ios/
├── App/
│   ├── TerraApp.swift              # @main, WindowGroup, environment setup
│   └── ContentView.swift           # TabView root with role-aware tabs
├── Models/
│   ├── Trip.swift                  # Trip, ItineraryDay (Codable + SwiftData)
│   ├── Booking.swift               # Booking, BookingCharge
│   ├── User.swift                  # User model
│   └── MerchantStats.swift         # KPI data model
├── Services/
│   ├── APIClient.swift             # Base URL, auth headers, generic request
│   ├── TripService.swift           # GET /trips, /trips/:slug
│   ├── OrderService.swift          # Create/authorize/capture orders
│   ├── BookingService.swift        # GET /bookings, /bookings/:id
│   ├── VaultService.swift          # Vault charge/delete
│   ├── InvoiceService.swift        # Create/send invoices
│   ├── MerchantService.swift       # Stats, charts data, all bookings
│   └── PayPalManager.swift         # PayPal SDK wrapper
├── Stores/
│   ├── AuthStore.swift             # @Observable: user, role, login/logout
│   ├── TripStore.swift             # @Observable: trips list, filtering
│   └── BookingStore.swift          # @Observable: bookings, refresh
├── Views/
│   ├── Explore/
│   │   ├── ExploreTabView.swift    # Category tabs (Tours/Cars/Cruises)
│   │   ├── TripListView.swift      # Grid of TripCards
│   │   ├── TripCardView.swift      # Card with image, price, badge
│   │   ├── TripDetailView.swift    # Hero image, itinerary, pricing
│   │   └── Checkout/
│   │       ├── CheckoutRouter.swift        # Dispatches to flow-specific view
│   │       ├── AuthorizeCheckoutView.swift  # Flow 1: deposit + balance
│   │       ├── VaultCheckoutView.swift      # Flow 2: setup + add-ons
│   │       ├── InvoiceRequestView.swift     # Flow 3: custom trip form
│   │       └── InstantCheckoutView.swift    # Flow 4: PayPal + Pay Later
│   ├── Bookings/
│   │   ├── BookingListView.swift           # Customer bookings list
│   │   ├── BookingDetailView.swift         # Payment timeline, status
│   │   └── BookingCardView.swift           # List row card
│   ├── Merchant/
│   │   ├── MerchantHomeView.swift          # KPI cards + recent bookings
│   │   ├── MerchantBookingListView.swift   # All bookings with filters
│   │   └── MerchantBookingDetailView.swift # Actions: capture, void, charge
│   ├── Profile/
│   │   ├── ProfileView.swift               # User info, role switcher
│   │   └── LoginView.swift                 # Mock auth
│   ├── Shared/
│   │   ├── ProcessingOverlay.swift         # Spinner overlay during payments
│   │   ├── ConfirmationView.swift          # Success screen with booking ref
│   │   ├── StatusBadge.swift               # Colored status badges
│   │   ├── PaymentTimeline.swift           # Vertical timeline component
│   │   ├── ErrorBanner.swift               # API error display
│   │   └── EmptyStateView.swift            # No-content placeholder
│   └── Components/
│       ├── TerraButton.swift               # Primary/outline/destructive variants
│       ├── TerraCard.swift                 # Card container with shadow
│       ├── InfoRow.swift                   # Label-value row
│       └── SectionHeader.swift             # Section title component
├── Theme/
│   ├── TerraColors.swift           # Color palette as SwiftUI Color extensions
│   ├── TerraTypography.swift       # Font styles (Inter via custom font)
│   └── TerraSpacing.swift          # 4/8pt spacing scale constants
├── Extensions/
│   ├── Date+Formatting.swift       # Date display helpers
│   ├── Double+Currency.swift       # Currency formatting
│   └── View+Loading.swift          # Loading modifier
└── Assets.xcassets/
    ├── Colors/                     # Named colors for TERRA palette
    └── Images/                     # Trip placeholder images
```

### State Management

- **AuthStore** (`@Observable`): holds current user, role (customer/merchant), login state, and per-tab navigation paths (`[Tab: [NavigationDestination]]`). Injected via `.environment()` at app root. On role change, all navigation paths are reset.
- **TripStore** (`@Observable`): trips array, selected category filter, loading state. Fetches from API, caches to SwiftData.
- **BookingStore** (`@Observable`): customer bookings, merchant bookings. Refreshes on pull-to-refresh.
- No global state bus — each store is independent and injected where needed.

### SwiftData Caching

- **Cached entities**: `Trip` and `ItineraryDay` only (read-only catalog data). Bookings are always fetched fresh.
- **Cache strategy**: On successful API fetch, upsert trips into SwiftData. On next launch, show cached trips immediately while fetching fresh data in background. Pull-to-refresh always hits the API and updates cache.
- **Integration**: `TripStore` owns a `ModelContext` and queries SwiftData on init. API responses are mapped to SwiftData models via a `save(trips:)` method.
- **No offline writes**: All mutations (bookings, payments) require network. If offline, show an alert with "No internet connection" and block checkout.

### Networking

- **APIClient**: `baseURL` configurable via `Config.plist` or `#if DEBUG` build flag. Default: `http://localhost:3001` for simulator, overridable for physical device testing (e.g., `http://192.168.x.x:3001`). A debug settings screen in Profile tab allows changing the base URL at runtime (stored in `UserDefaults`).
- Adds `X-User-Role` header from AuthStore on every request, plus `Content-Type: application/json`.
- Generic `request<T: Decodable>(method:path:body:)` method with async/await.
- **Error handling**: `APIError` enum with cases: `.networkError(Error)`, `.serverError(statusCode: Int, message: String)`, `.decodingError(Error)`. Displayed via `ErrorBanner` component with a "Retry" button that re-invokes the failed request.
- **Timeout**: 30-second request timeout. Long-polling for invoice status uses 5-second intervals with max 60 retries.

---

## Navigation

### TabView Structure (4 tabs — matches storyboard labels)
| Tab | SF Symbol | Label | Customer | Merchant |
|-----|-----------|-------|----------|----------|
| Home | `house` | Home | Browse & book trips | Browse (read-only) |
| Search | `magnifyingglass` | Search | Filter/search trips | Filter/search trips |
| Bookings | `calendar` | Bookings | My bookings | All bookings (filterable) + KPI header |
| Profile | `person.circle` | Profile | Login, role switch | Login, role switch |

- **Merchant features** are embedded in the Bookings tab when `authStore.role == .merchant`: a KPI summary card row at the top, followed by all bookings with filters. This avoids a hidden tab and matches the storyboard tab labels (Home, Search, Bookings, Profile).
- **Search tab**: text search + category filter for trips. Simple filter view on initial implementation.
- iPad: `NavigationSplitView` — sidebar shows tab items as navigation links, detail column shows content. On compact width, falls back to standard `TabView`.
- iPhone: standard `TabView` with `NavigationStack` per tab.

### Navigation Patterns
- `NavigationStack(path:)` with `@State var path: [NavigationDestination]` per tab for type-safe navigation. Each tab has its own path binding.
- Trip list → Trip detail → Checkout → Processing → Confirmation (linear flow)
- Booking list → Booking detail (push)
- Merchant booking detail: Flow 1 "Capture Balance" navigates to a dedicated **CaptureBalanceView** (full screen, not a dialog — per storyboard screen 8). Flow 2 "Charge Add-on" presents a **ChargeAddonSheet** (`.sheet` with form — amount presets, description, customer info, charge button). Destructive actions (void, refund, delete vault) use `.confirmationDialog`.
- Back navigation via standard iOS swipe-back gesture
- **Confirmation screen navigation**: After payment succeeds, reset the navigation path to root and present `ConfirmationView` via a separate `@State var showConfirmation: Bool` full-screen cover (`.fullScreenCover`). This prevents back-swiping to the checkout screen. The "View My Bookings" CTA dismisses the cover and switches to the Bookings tab.
- **Role switching**: `AuthStore` holds a `@Published navigationPaths` dictionary keyed by tab. On role change, all paths are reset to empty arrays. The `TabView` selection resets to `.home`.
- **PayPal cancellation/error**: If the user dismisses the PayPal sheet or an error occurs, the checkout view remains visible. An `ErrorBanner` appears at top with the error message and a "Try Again" button. The user can also navigate back normally.

---

## Screens

### 1. Explore Tab

**ExploreTabView** — Segmented control at top: Tours | Car Rentals | Cruises
- Maps to web app's tabbed homepage
- Switches `TripStore.selectedCategory` filter
- Grid layout: 1 column on iPhone, 2 columns on iPad

**TripCardView** — Card component
- AsyncImage for trip photo (with gradient overlay at bottom)
- Trip name, price, duration badge (top-right with Clock icon)
- Payment flow badge (top-left: "Reserve Now", "Add-ons", "Invoice", "Pay Later")
- Tap navigates to TripDetailView

**TripDetailView** — Full detail screen
- Hero image (full-width, with parallax scroll effect)
- Back button overlaid on image
- Info chips: duration, price, deposit (if applicable), payment flow
- Itinerary section (day-by-day list for tours, specs grid for cars, ports for cruises)
- "What's Included" list with SF Symbol icons
- "Package Includes" card: itemized fee breakdown (accommodation, activities, meals, transport, etc.) with amounts summing to trip total. Mockup data per trip slug with generic fallback (40/25/20/15% split).
- Payment schedule card (deposit/balance for authorize/vault flows)
- Pricing card (cabin selector for cruises, date picker with computed total for cars)
- Primary CTA button ("Reserve with Deposit", "Book Now", etc.)
- Reference: `ios/docs/ui/trip-authorize-flow.html` screens 1-2, `car-rental-flow.html` screens 1-2, `cruise-booking-flow.html` screens 1-2

### 2. Checkout Flows

**CheckoutRouter** — Reads `trip.payment_flow` and presents the correct checkout view.

**Flow 1: AuthorizeCheckoutView**
- Order summary card (trip photo from asset catalog + name + price)
- Package breakdown: itemized fees (accommodation, activities, meals, transport, etc.) summing to trip total
- Payment schedule: deposit (charged now) vs balance (after trip)
- Info callout explaining authorize & capture
- PayPal button (via PayPal iOS SDK — AUTHORIZE intent)
- On approval: server authorizes → captures deposit → shows confirmation
- Confirmation: checkmark, TERRA-XXXX ref, step indicator (1 of 2), "View My Bookings" CTA
- Reference: `trip-authorize-flow.html` screens 3-5

**Flow 2: VaultCheckoutView**
- Order summary card (trip photo from asset catalog + name + setup fee)
- "How It Works" steps card: 3 numbered steps (setup fee → add-ons during trip → final settlement)
- Package breakdown: itemized fees summing to subtotal
- Payment schedule: setup fee (charged now), add-ons during trip (varies), final settlement (after trip)
- Info callout explaining vault/recurring billing
- PayPal button (CAPTURE intent with vault instruction `UNSCHEDULED_POSTPAID`)
- On approval: server creates order, captures setup fee, stores vault token
- Confirmation: checkmark, TERRA-XXXX ref, vault status badge, explains merchant can charge add-ons
- Customer booking detail additions: charges table (date/description/amount/status), "Remove Saved Payment" option
- Merchant booking detail additions: "Charge Add-on" button opens a **ChargeAddonSheet** (`.sheet`) with preset amounts (e.g., "Travel Insurance $50", "Excursion $75"), custom amount input, description field, "Charging to" customer info, and a "Charge" button. "Final Settlement" button uses `.confirmationDialog`.
- Reference: web app `CheckoutVaultPage.tsx`, `VaultBookingDetailPage.tsx`, `ChargeAddonDialog.tsx`

**Flow 3: InvoiceRequestView**
- Multi-step form: select destinations (multi-select), activities with prices, travel dates, notes
- "Submit Request" button (no PayPal payment at this step)
- Server creates trip request → auto-generates PayPal invoice → sends to customer
- Confirmation: shows request submitted, invoice will be emailed
- Invoice detail view with QR code and PayPal payment link
- No existing storyboard — design follows web app patterns

**Flow 4: InstantCheckoutView**
- Order summary card (trip photo from asset catalog + name + total)
- Car rental: shows "X days x $rate/day" with computed subtotal + tax = total (receives pickup/dropoff dates from detail view via NavigationDestination)
- Cruise: shows trip name + base price + tax = total
- PayPal button (CAPTURE intent) + official PayPal Pay Later button + PayPal Message banner
- On approval: server creates order, captures full amount
- Confirmation: checkmark, ref, total paid, "View My Bookings" CTA
- Reference: `car-rental-flow.html` screens 3-5, `cruise-booking-flow.html` screens 3-5

**ProcessingOverlay** — Shared component
- Full-screen dimmed overlay with centered modal
- Spinner + "Processing Payment..." + "Please don't close this screen"
- Blocks interaction during server round-trip
- Reference: all flow storyboards screen 4

### 3. Bookings Tab

**BookingListView** (Customer)
- List of bookings as cards with: trip name, ref (TERRA-XXXX), status badge, date, amount
- Pull-to-refresh
- Empty state: "No bookings yet" with CTA to explore
- Tap navigates to BookingDetailView

**BookingDetailView** (Customer)
- Header: TERRA-XXXX ref + status badge
- Trip info card (thumbnail, name, dates)
- Payment timeline (vertical dots + lines):
  - Flow 1: deposit authorized → deposit captured → balance pending/captured
  - Flow 2: setup fee → add-on charges → final settlement
  - Flow 3: request submitted → invoice sent → invoice paid
  - Flow 4: full payment captured
- Progress bar for partial payments (e.g., 25% for deposit-only)
- PayPal order details card (order ID, capture ID, status)
- Authorization countdown (Flow 1: "24 days remaining")
- Reference: all flow storyboards screen 6

### 4. Merchant Tab (Lite)

**MerchantHomeView**
- 4 KPI cards in 2x2 grid: Active Bookings, Pending Captures, Open Invoices, Monthly Revenue
- Recent bookings list (last 5, tap to view detail)
- No charts (simplified from web dashboard)

**MerchantBookingListView**
- All bookings list with filter chips: All | Authorize | Vault | Invoice | Instant
- Status filter: All | Pending | Completed
- Each row: customer name, trip, ref, status badge, amount
- Tap navigates to MerchantBookingDetailView

**MerchantBookingDetailView**
- "Merchant View" badge at top
- Customer info card (avatar, name, email)
- Trip/rental/cruise info card
- Payment status card (flow-specific):
  - Flow 1: auth status, auth ID, countdown, progress bar, "Capture Balance" / "Void" buttons
  - Flow 2: vault status, charge history, "Charge Add-on" / "Final Settlement" buttons
  - Flow 3: invoice status, invoice link, "Resend Invoice" button
  - Flow 4: capture status, "Issue Refund" button
- Confirmation dialogs (`.confirmationDialog`) before destructive actions
- Reference: all flow storyboards screen 7

### 5. Profile Tab

**ProfileView**
- User avatar (initials circle), name, email
- Role switcher: `Picker` with `.segmented` style (Customer / Merchant)
- Switching role updates AuthStore, resets navigation stacks
- Logout button (destructive style)

**LoginView**
- Simple form: pick from pre-seeded users (dropdown)
- "Login as Customer" / "Login as Merchant" buttons
- Auto-navigates to Explore tab on login

---

## Design System

### Colors (SwiftUI extension on Color)

WCAG AA contrast-verified palette. Includes text-safe variants for colors that fail 4.5:1 on light backgrounds.

```swift
extension Color {
    // Core palette
    static let terraMocha = Color(hex: "#5C3D2E")         // 9.03:1 on AlpineOat ✓
    static let terraTerracotta = Color(hex: "#A0522D")     // 5.22:1 on AlpineOat ✓
    static let terraSage = Color(hex: "#86A873")           // Background fills only (2.48:1)
    static let terraSageText = Color(hex: "#5D8A48")       // Text-safe sage (4.58:1) ✓
    static let terraAlpineOat = Color(hex: "#FAF6F1")      // Screen background
    static let terraIvory = Color(hex: "#FFFDF9")          // Card background
    static let terraBorder = Color(hex: "#E8DFD4")         // Dividers
    static let terraText = Color(hex: "#3D2B1F")           // 12.48:1 on AlpineOat ✓
    static let terraTextMuted = Color(hex: "#7A6347")      // Darkened from #8B7355 (5.0:1) ✓
    static let terraWarning = Color(hex: "#B8860B")        // Badge backgrounds only (3.02:1)
    static let terraWarningText = Color(hex: "#8B6508")    // Text-safe warning (4.65:1) ✓
    static let terraDestructive = Color(hex: "#DC2626")    // 4.83:1 on white ✓
}
```

**Usage rules:**
- `terraSage` — only for badge backgrounds, progress bar fills, timeline dots. Never as text color.
- `terraSageText` — for "completed" text labels, checkmark icons, success messages.
- `terraWarning` — only for badge backgrounds. Use `terraWarningText` for warning text.
- `terraTextMuted` — safe for all text at 12pt+. For 10-11pt footnotes, use `terraText` instead.

### Typography

- **System font** (San Francisco) for body text — native iOS feel
- **Inter** (custom font via asset catalog) for headings and branded elements — matching web app. Download from Google Fonts (OFL license, App Store compatible). Bundle `Inter-Regular.ttf`, `Inter-Medium.ttf`, `Inter-SemiBold.ttf`, `Inter-Bold.ttf` in the app target and register in `Info.plist` under `UIAppFonts`.
- Type scale: 28pt (large title), 22pt (title), 16pt (headline), 14pt (body), 12pt (caption), 11pt (footnote — bumped from 10pt for contrast compliance)

### Spacing
- 4pt base unit, multiples: 4, 8, 12, 16, 20, 24, 32, 48
- Card padding: 12-16pt
- Section spacing: 24pt
- Screen edge insets: 16pt (iPhone), 20pt (iPad)

### Components

- **TerraCard**: white background (`terraIvory`), 12pt corner radius, subtle shadow
- **TerraButton**: 4 variants — primary (terracotta bg), outline (terracotta border), destructive (red border), ghost (text-only, muted)
- **PayPalButton**: PayPal yellow (#FFC439) with PayPal logo, 24pt corner radius — separate from TerraButton since it follows PayPal brand guidelines
- **StatusBadge**: rounded pill with background tint + icon (not color alone — WCAG): checkmark + sage (completed), clock + warning (pending), circle + blue (active), building + purple (merchant). Text uses `terraSageText`/`terraWarningText` for contrast compliance.
- **PaymentTimeline**: vertical line with colored dots (done=sage fill, pending=gray border). 20pt dots, 2pt connecting line.
- **InfoRow**: horizontal label-value pair with muted label
- **ChargeAddonSheet**: `.sheet` with preset amount chips, custom amount field, description, customer info, charge CTA

### iOS-Specific UX

**Interaction Safety:**
- Pull-to-refresh on list views only (Explore, Bookings, Merchant). **Disabled** on checkout and confirmation screens to prevent accidental refresh during payment.
- PayPal button and "Submit Request" button disable immediately on tap + show spinner (`isLoading`) to prevent duplicate order creation.
- Swipe-back gesture blocked during ProcessingOverlay via `.navigationBarBackButtonHidden(true)` + `.interactiveDismissDisabled(true)`.
- ChargeAddonSheet uses `.interactiveDismissDisabled` when form has unsaved input, with confirmation dialog before discarding.

**Haptics:**
- `.impact(.medium)` on PayPal button tap
- `.notification(.success)` on payment confirmation and merchant actions (capture/charge/void)
- `.notification(.error)` on payment failure
- No haptic on voluntary cancel/dismiss

**Loading & Feedback:**
- Skeleton views (`.redacted(reason: .placeholder)`) with placeholder data arrays (3-5 items) on Explore, Bookings, Merchant, BookingDetail.
- ErrorBanner (sticky top banner) with error message + "Retry" button. Posts `UIAccessibility.post(notification: .announcement)` for VoiceOver.
- `.confirmationDialog` for destructive actions (capture, void, refund, delete vault, final settlement)

**Forms:**
- `.scrollDismissesKeyboard(.interactively)` on all scrollable form views
- "Done" toolbar button (`.toolbar { ToolbarItemGroup(placement: .keyboard) }`) to dismiss keyboard
- Validate on focus loss, not on every keystroke

**Accessibility:**
- `.accessibilityLabel` on all icon-only buttons, AsyncImage trip photos, StatusBadge, payment flow badges
- StatusBadge includes icon alongside color (checkmark, clock, circle) — color is not the only indicator
- Respect `@Environment(\.accessibilityReduceMotion)`: disable parallax hero, button scale animations, stagger entrance. Keep ProcessingOverlay spinner (functional).
- Support Dynamic Type without truncation (tested at AX3). Minimum text size 11pt.
- Safe area compliance for all fixed elements (tab bar, processing overlay, Dynamic Island)

**Animations (when reduce-motion is off):**
- Spring curves for modal transitions: `.spring(response: 0.35, dampingFraction: 0.85)`
- Ease-out for element entrance, ease-in for exit
- Stagger trip card grid entrance by 30-50ms per item
- Hero image shared transition via `.matchedGeometryEffect` (card → detail)

**Navigation Enhancements:**
- Tab badge count on Bookings tab for pending actions (`.badge(count)`)
- Search tab empty state: "Recent Searches" (UserDefaults, max 5) + "Popular Destinations"
- "View My Bookings" from ConfirmationView scrolls to newly created booking + triggers refresh
- Deep link-ready NavigationDestination enum (e.g., `terra-ios://booking/TERRA-T5K6`)

---

## PayPal Integration

### PayPal iOS SDK Setup

SPM packages already added to Xcode project:
- `paypal-ios` v2.0.1 — provides `PaymentButtons` (official branded buttons), `CorePayments`, `PayPalWebPayments`, `CardPayments`, `FraudProtection`
- `paypal-messages-ios` v1.2.0 — provides `PayPalMessages` (Pay Later messaging banners)

**Official UI Components Used:**
- `PayPalButton.Representable` — official gold PayPal checkout button (UIViewRepresentable wrapper)
- `PayPalPayLaterButton.Representable` — official Pay Later button
- `PayPalMessageView.Representable` — official Pay Later messaging banner (shows "Pay in 4 of $X.XX" dynamically based on amount)

**PayPalMessageView Configuration:**
```swift
PayPalMessageData(
    clientID: "sandbox-client-id",
    environment: .sandbox,
    amount: totalAmount,
    pageType: .productDetails,  // or .checkout
    offerType: .payLaterShortTerm  // NOT .payLaterPayIn4 (doesn't exist)
)
```

Available `PayPalMessageOfferType` values: `.payLaterShortTerm`, `.payLaterLongTerm`, `.payLaterPayIn1`, `.payPalCreditNoInterest`

**Sandbox Client ID:** Hardcoded in `PayPalMessageBanner.swift` for demo. Production should use Config.plist or environment variable.

### PayPalManager API Surface

```swift
@Observable
class PayPalManager {
    var isProcessing = false
    var error: PayPalError?

    /// Creates order on server, presents PayPal sheet, handles approval
    func startCheckout(
        tripSlug: String,
        intent: PaymentIntent,  // .authorize or .capture
        extras: [String: Any]   // vault instructions, dates, etc.
    ) async throws -> BookingResult {
        // 1. POST /api/orders → get orderID
        // 2. Present PayPal native sheet via Checkout.start(...)
        // 3. On approve callback → POST /api/orders/:id/authorize or /capture
        // 4. Return BookingResult with ref, status, amounts
    }
}

enum PaymentIntent { case authorize, capture }
```

- PayPal SDK presents a native `SFSafariViewController`-based sheet. No SwiftUI view needed — it's presented modally by the SDK.
- The SDK uses a return URL scheme configured in `Info.plist` (e.g., `terra-ios://paypalpay`). Register this as a URL scheme.
- **Cancellation**: SDK calls `onCancel` callback → dismiss sheet, show nothing (user stays on checkout). No error banner needed for voluntary cancel.
- **Error**: SDK calls `onError` callback → show `ErrorBanner` with message and "Try Again" button. Checkout view remains interactive.

### Payment Flow (all flows follow this pattern)

1. **Client** taps "Pay with PayPal"
2. **Client → Server**: `POST /api/orders` with trip details and intent (AUTHORIZE or CAPTURE)
3. **Server → PayPal**: Creates order via PayPal Server SDK
4. **Server → Client**: Returns order ID
5. **Client**: Calls `PayPalCheckout.Checkout.start(presentingViewController:createOrder:onApprove:onCancel:onError:)` with order ID
6. **SDK**: Presents native PayPal login/approval sheet
7. **User**: Approves in PayPal sheet (or cancels → stays on checkout)
8. **SDK → Client**: Calls `onApprove` with order ID and payer info
9. **Client → Server**: `POST /api/orders/:id/authorize` or `/capture`
10. **Server → PayPal**: Authorizes or captures the order
11. **Server → Client**: Returns booking details
12. **Client**: Shows confirmation via `.fullScreenCover`

### Pay Later Availability

- **Flow 1 (Authorize)**: Show "Pay Later" link below PayPal button (per storyboard). Note: Pay Later with AUTHORIZE intent has limited availability — the server should check eligibility. If not eligible, hide the link.
- **Flow 2 (Vault)**: No Pay Later — vault flows are merchant-initiated.
- **Flow 3 (Invoice)**: No PayPal button — invoice-based.
- **Flow 4 (Instant)**: Show "Pay Later" message and standalone Pay Later button (primary use case).

### Vault Flow (Flow 2) Addition
- Step 2 includes `payment_source.paypal.attributes.vault.usage_type: "MERCHANT"` and `store_in_vault: "ON_SUCCESS"`
- After capture, server stores vault token for future charges
- Merchant-initiated charges use `POST /api/vault/charge` with stored token

### Invoice Flow (Flow 3) Difference
- No PayPal SDK involved at checkout — customer submits a trip request form
- Server creates a PayPal invoice via Invoice API and sends it to customer's email
- Customer pays invoice via link/QR code (outside the app)
- App polls `GET /api/invoices/:id/status` to track payment

---

## API Endpoints Used

All endpoints are on the existing Express backend. No new endpoints needed.

| Method | Path | Used By |
|--------|------|---------|
| GET | /api/trips | ExploreTabView |
| GET | /api/trips/:slug | TripDetailView |
| POST | /api/orders | Flow 1, 2, 4 checkout (not Flow 3) |
| POST | /api/orders/:id/authorize | Flow 1 |
| POST | /api/orders/:id/capture | Flow 1, 4 |
| POST | /api/vault/charge | Flow 2 merchant |
| DELETE | /api/vault/:token | Flow 2 merchant |
| POST | /api/trip-requests | Flow 3 |
| POST | /api/invoices | Flow 3 |
| POST | /api/invoices/:id/send | Flow 3 |
| GET | /api/invoices/:id/status | Flow 3 |
| GET | /api/bookings | BookingListView |
| GET | /api/bookings/:id | BookingDetailView |
| GET | /api/merchant/stats | MerchantHomeView |
| GET | /api/merchant/bookings | MerchantBookingListView |

---

## Reference Materials

- `ios/docs/ui/trip-authorize-flow.html` — 8-screen storyboard for Flow 1 (Authorize & Capture)
- `ios/docs/ui/car-rental-flow.html` — 7-screen storyboard for Flow 4 (Instant/Car Rental)
- `ios/docs/ui/cruise-booking-flow.html` — 7-screen storyboard for Flow 4 (Instant/Cruise)
- Web app source: `client/src/` — React component reference for behavior and data flow
- Server source: `server/src/` — API contracts and database schema

---

## Success Criteria

1. All 4 payment flows work end-to-end with PayPal sandbox
2. Customer can browse trips, book, and view booking details
3. Merchant can view KPI stats, list bookings, and perform payment actions
4. Role switching works without app restart
5. iPad layout uses NavigationSplitView with sidebar
6. UI matches TERRA earth-tone design system
7. Loading, error, and empty states are handled gracefully
8. All touch targets meet 44pt minimum
9. Dynamic Type is supported without layout breakage
