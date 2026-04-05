# TERRA iOS — Progress Log

## 2026-04-05 — Planning Complete
- Completed brainstorming with UI/UX Pro Max skill
- Created design spec with WCAG AA verified color palette
- Ran spec review (4 blockers, 8 warnings fixed)
- Generated implementation plan (49 tasks, 7 sections)
- UX review identified contrast issues (sage 2.48:1, muted 4.17:1) — fixed with text-safe color variants
- Added accessibility tasks (VoiceOver labels, reduce motion, color-not-only)
- Added interaction safety (double-tap prevention, swipe-back guard, keyboard avoidance)
- Plan approved for sequential implementation

## 2026-04-05 — Section 1 Implementation + Section 2 Models
- Created folder structure (14 directories)
- Created TerraColors.swift (12 WCAG-verified color tokens with hex initializer)
- Created TerraTypography.swift (6-level type scale, Inter headings + SF body)
- Created TerraSpacing.swift (4pt-based spacing scale)
- Created 6 shared components: TerraCard, TerraButton (4 variants), StatusBadge (icon+text), InfoRow, SectionHeader, PayPalButton
- Created APIClient (async/await, snake_case decoding, configurable baseURL, APIError enum)
- Created models: User (with avatarInitials), Trip (with TripCategory/PaymentFlow enums), Booking, BookingDetail, BookingCharge, MerchantStats
- Created AuthStore (@Observable, role switching, navigation path reset, UserDefaults persistence)
- Created business logic: BookingCalculator, PayLaterCalculator, ChargeAddonValidator
- Created extensions: Double+Currency, Date+Formatting
- Created 53 tests across 7 test files + 3 JSON fixtures
- Inter font downloaded and registered in Info.plist
- Test target added by user in Xcode
- Code review: fixed 4 CRITICAL + 4 IMPORTANT issues (Swift 6 concurrency, Dynamic Type, NumberFormatter caching)

## 2026-04-05 — Section 2: Auth & Navigation
- Created LoginView with pre-seeded user picker + dual login buttons
- Created ProfileView with avatar, role switcher (segmented), logout, debug info
- Updated ContentView with TabView (iPhone) / NavigationSplitView (iPad)
- Updated trip_iosApp to inject AuthStore via .environment()
- Placeholder views for Home/Search/Bookings tabs (replaced in Section 3)
- Code review fixes: NavigationStack path binding, role switcher double-mutation, iPad selection binding
- TDD review fixes: MockHTTPClient with NSLock, deterministic countdown, exhaustive assertions
- Final review fixes: test target SWIFT_DEFAULT_ACTOR_ISOLATION=MainActor, Tab→TerraTab rename (SwiftUI collision), .formatted() for currency, UserDefaults cleanup
- All 77 tests passing

## 2026-04-05 — Section 3: Trip Browsing
- Created TripService (fetchTrips, fetchTrip by slug)
- Created TripStore (@Observable, category filtering, error handling)
- Shared TripStore via .environment() — single instance for Explore + Search
- ExploreTabView with segmented category control + error view with retry
- TripListView with adaptive grid (1-col iPhone, 2-col iPad) + skeleton loading
- TripCardView with parsed server gradients, flow/duration badges, accessibility labels
- TripDetailView with 3 category-specific layouts (tour itinerary, car date picker, cruise cabin selector)
- SearchView with text filter, category chips, refreshable
- Extracted Trip+Helpers.swift (gradientColors, durationLabel, flowBadgeLabel, priceLabel)
- ContentView wired: Home→Explore, Search→SearchView, trip detail reuses store data

## 2026-04-05 — Section 4: Payment Flows
- Created OrderService (createOrder, authorizeOrder, captureOrder)
- Created VaultService (chargeVault, deleteVault)
- Created InvoiceService (createTripRequest, createInvoice, sendInvoice, pollInvoiceStatus)
- ProcessingOverlay with spring animation + reduce motion support + interactiveDismissDisabled
- ConfirmationView as fullScreenCover with flow-specific content, step indicator, info callouts
- PayLaterMessage component (full button + installment text, or link-only)
- CheckoutRouter dispatches to 4 flow views with processing/confirmation state management
- AuthorizeCheckoutView (Flow 1): fee breakdown, info callout, PayPal button, Pay Later link
- VaultCheckoutView (Flow 2): How It Works steps, setup fee, vault extras
- InstantCheckoutView (Flow 4): price breakdown, PayPal button, Pay Later full, secure badge
- InvoiceRequestView (Flow 3): multi-select destinations/activities, date pickers, notes, keyboard avoidance
- All checkout views: error display, button loading state, navigation to confirmation

## 2026-04-05 — Section 5: Customer Bookings
- BookingService (fetchBookings, fetchBooking by id)
- BookingStore (@Observable, loading/error)
- EmptyStateView (reusable: icon, title, subtitle, CTA)
- BookingCardView (gradient thumbnail, ref, status badge, amount, accessibility)
- BookingListView (pull-to-refresh, skeleton loading, empty state with "Explore Trips" CTA)
- PaymentTimeline (reusable: 4 flow-specific factory methods, checkmark dots, connecting lines)
- BookingDetailView (header, trip card, timeline, progress bar, auth countdown, PayPal details)

## 2026-04-05 — Section 6: Merchant Features
- MerchantService (fetchStats, fetchAllBookings, captureBalance, voidAuth)
- MerchantHomeView (2x2 KPI grid, flow filter chips, all bookings list)
- MerchantBookingDetailView (merchant badge, customer card, trip info, payment status, capture/void actions with confirmationDialog)
- Code review fixes: API paths corrected (payments/authorizations/:authId), MerchantActionResponse, error handling, double checkmark removed

## 2026-04-05 — Trip Images + PayPal Official UI
- Copied 9 trip images from web app's client/public/ to iOS Asset Catalog
- Converted all WebP → JPEG (Asset Catalog doesn't support WebP)
- Added Trip.imageName/hasImage helpers, updated TripCardView, TripDetailView, BookingCardView
- Replaced custom PayPalButton with official PayPalButton.Representable from PaymentButtons SDK
- Replaced custom Pay Later button with official PayPalPayLaterButton.Representable
- Added PayPalMessageBanner component using PayPalMessageView.Representable from PayPalMessages SDK
- PayPal Pay Later message added to car rental detail view and instant checkout view
- Updated design spec with PayPal SDK component details and correct enum values
- Updated implementation plan with key learnings (14 issues documented in debug-log.md)
