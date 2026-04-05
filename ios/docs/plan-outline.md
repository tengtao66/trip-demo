# TERRA iOS — Implementation Plan Outline

> Spec: `ios/docs/superpowers/specs/2026-04-05-terra-ios-app-design.md`

## Section 1: Project Foundation & Theme (8 tasks)

Setup Xcode project structure, SPM dependencies, TERRA design system (colors, typography, spacing), shared components (TerraCard, TerraButton, StatusBadge, InfoRow, PayPalButton), and the base APIClient with configurable base URL. This section has zero UI screens — just the building blocks.

**Key decisions:** Inter font bundling, Color hex initializer, APIClient error handling pattern, SwiftData model container setup.

## Section 2: Auth, Navigation Shell & Profile (6 tasks)

AuthStore (@Observable), LoginView with pre-seeded users, ProfileView with role switcher, ContentView TabView (Home/Search/Bookings/Profile), NavigationStack per tab, iPad NavigationSplitView adaptive layout. Role switching resets all navigation paths.

**Key decisions:** Tab enum with role-aware visibility, navigation path storage pattern, UserDefaults persistence for auth.

## Section 3: Trip Browsing — Explore & Search (7 tasks)

TripService, TripStore with SwiftData caching, ExploreTabView with category segmented control, TripListView grid, TripCardView with AsyncImage + badges, TripDetailView (hero parallax, itinerary, specs, pricing), SearchView with text filter. Category-specific detail layouts (tour itinerary, car specs + date picker, cruise ports + cabin selector).

**Key decisions:** SwiftData upsert strategy, AsyncImage placeholder/error states, parallax scroll implementation.

## Section 4: Payment Flows — Checkout & PayPal (10 tasks)

PayPalManager singleton, CheckoutRouter, all 4 checkout views (Authorize, Vault, Instant, Invoice), ProcessingOverlay, ConfirmationView with .fullScreenCover, PayPal SDK integration (URL scheme, approval/cancel/error callbacks), server order creation, pay later messaging. Each flow is a self-contained task.

**Key decisions:** PayPal iOS SDK version and SPM setup, return URL scheme, .fullScreenCover navigation reset, invoice polling strategy.

## Section 5: Customer Bookings (5 tasks)

BookingService, BookingStore, BookingListView with pull-to-refresh, BookingCardView, BookingDetailView with flow-specific payment timeline, progress bar, authorization countdown, PayPal order details card. EmptyStateView for no bookings.

**Key decisions:** Timeline component reuse across flows, countdown timer implementation, booking status enum mapping.

## Section 6: Merchant Features (6 tasks)

MerchantService, MerchantHomeView with KPI cards, MerchantBookingListView with filter chips, MerchantBookingDetailView with flow-specific actions, CaptureBalanceView (full screen for Flow 1), ChargeAddonSheet (.sheet for Flow 2), confirmation dialogs for destructive actions.

**Key decisions:** Merchant features embedded in Bookings tab header, KPI card layout (2x2 grid), action result feedback (haptics + toast).

## Section 7: Polish & Testing (5 tasks)

Skeleton loading states (.redacted), ErrorBanner component, haptic feedback on payment actions, Dynamic Type support verification, iPad layout testing, end-to-end PayPal sandbox testing for all 4 flows, debug settings screen (base URL override).

**Key decisions:** Which screens need skeletons, error retry patterns, accessibility audit scope.
