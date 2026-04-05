# Section 3: Trip Browsing — Explore & Search

> Dependencies: Section 1 (design system, shared components, APIClient) and Section 2 (AuthStore, TabView shell, NavigationStack)

---

### Task 3.1 — Trip Model & SwiftData Schema

**Files:** `Models/Trip.swift`
**Produces:** `Trip` and `ItineraryDay` structs conforming to `Codable`, `Identifiable`, and `@Model` (SwiftData). Fields: `slug`, `name`, `category` (enum: `.tour`, `.carRental`, `.cruise`), `description`, `imageURL`, `price`, `depositAmount?`, `duration`, `paymentFlow` (enum: `.authorize`, `.vault`, `.invoice`, `.instant`), `included` (array of strings), `itinerary` (relationship to `[ItineraryDay]`), `specs` (optional JSON for car/cruise-specific data: seats, transmission, fuel, cabin types, ports). Add `createdAt`/`updatedAt` for cache freshness.
**Dependencies:** None beyond Swift 6 project setup.
**Acceptance criteria:**
- Trip decodes from the `/api/trips` JSON response without loss.
- SwiftData `ModelContainer` can persist and query Trip entities.
- Category and payment-flow enums have raw-string coding keys matching the backend.

### Task 3.2 — TripService

**Files:** `Services/TripService.swift`
**Produces:** Service with two async methods: `fetchTrips() async throws -> [Trip]` and `fetchTrip(slug:) async throws -> Trip`. Uses `APIClient.request(method:path:body:)` internally. Maps `APIError` cases for network, server, and decoding failures.
**Dependencies:** Task 1.x (APIClient), Task 3.1 (Trip model).
**Acceptance criteria:**
- `fetchTrips()` returns decoded array from `GET /api/trips`.
- `fetchTrip(slug:)` returns a single trip from `GET /api/trips/:slug`.
- Errors propagate as typed `APIError` values.

### Task 3.3 — TripStore with SwiftData Caching

**Files:** `Stores/TripStore.swift`
**Produces:** `@Observable` class holding `trips: [Trip]`, `selectedCategory: TripCategory`, `isLoading: Bool`, `error: APIError?`. On init, loads cached trips from SwiftData `ModelContext` immediately, then calls `TripService.fetchTrips()` in background. On success, upserts trips into SwiftData via `save(trips:)` (insert-or-update by slug). Exposes `filteredTrips` computed property that filters by `selectedCategory`. Pull-to-refresh triggers a forced API fetch and cache update.
**Dependencies:** Task 3.1, Task 3.2.
**Acceptance criteria:**
- Cached trips display instantly on cold launch after first fetch.
- Switching `selectedCategory` immediately filters the list without re-fetching.
- Pull-to-refresh replaces stale cache with fresh API data.
- Concurrent access is safe (Swift 6 `Sendable` compliance).

### Task 3.4 — ExploreTabView & TripListView

**Files:** `Views/Explore/ExploreTabView.swift`, `Views/Explore/TripListView.swift`
**Produces:** ExploreTabView with a `Picker(.segmented)` for Tours / Car Rentals / Cruises at the top, binding to `tripStore.selectedCategory`. Below, a `TripListView` displaying `filteredTrips` in a `LazyVGrid`: 1-column on iPhone (compact width), 2-column on iPad (regular width) using `@Environment(\.horizontalSizeClass)`. Shows `.redacted(reason: .placeholder)` skeleton cards during loading. Empty state uses `EmptyStateView` when category has no trips. Pull-to-refresh via `.refreshable`.
**Dependencies:** Task 3.3, Task 1.x (TerraCard, EmptyStateView, skeleton modifier).
**Acceptance criteria:**
- Segmented control switches category and grid updates instantly.
- Grid adapts between 1 and 2 columns based on size class.
- Loading state shows 3 skeleton TripCardViews.
- Error state shows `ErrorBanner` with retry.

### Task 3.5 — TripCardView

**Files:** `Views/Explore/TripCardView.swift`
**Produces:** Card component matching storyboard screen 1 across all three categories. Structure: `TerraCard` containing `AsyncImage` (with gradient overlay at bottom for tour/cruise, plain for car), trip name overlaid on gradient (tours/cruises) or below image (cars), price label, duration badge (top-right pill with clock SF Symbol). Payment flow badge (top-left): "Reserve Now" for authorize, "Add-ons" for vault, "Invoice" for invoice, "Pay Later" for instant. Uses `AsyncImage` with `.placeholder` (gray rectangle with shimmer) and `.failure` (SF Symbol `photo` icon). Car cards show price as `$X/day`. Cruise cards show route text below name. Tap area is the full card, triggering `NavigationLink` to `TripDetailView`.
**Dependencies:** Task 3.1, Task 1.x (TerraCard, StatusBadge).
**Acceptance criteria:**
- Card renders correctly for all 3 categories with appropriate layout variations.
- AsyncImage loads, shows placeholder during load, and handles failure.
- Badges display correct payment flow label.
- Tap navigates to detail via NavigationStack path.

### Task 3.6 — TripDetailView with Category-Specific Layouts

**Files:** `Views/Explore/TripDetailView.swift`
**Produces:** Full detail screen with hero image (full-width, parallax via `GeometryReader` offset tracking in scroll), back button overlaid on hero, info chips row (duration, price, deposit if applicable, payment flow badge). Below hero, category-specific content sections:

**Tour layout** (per `trip-authorize-flow.html` screen 2): Day-by-day itinerary list (Day N badge + title + description), "What's Included" list with SF Symbol icons, fee schedule card (deposit now / balance later / total), info callout explaining authorize & capture, "Reserve with Deposit" CTA button.

**Car rental layout** (per `car-rental-flow.html` screen 2): Hero image with car icon placeholder, 4-item spec grid (seats, transmission, fuel, A/C), date picker section with pickup/dropoff `DatePicker` controls, computed rental duration and subtotal, price summary card (subtotal + tax + total), "Continue to Checkout" CTA.

**Cruise layout** (per `cruise-booking-flow.html` screen 2): Hero with gradient and cruise name, info row (duration, ports, departure city), cabin selector as `Picker(.segmented)` with 3 tiers (Interior/Ocean View/Balcony) showing price per tier, port-by-port itinerary with dot timeline, "What's Included" chips, price breakdown card (cabin + port fees + tax + total), "Book Now" CTA.

CTA button taps push to `CheckoutRouter` via NavigationStack path.
**Dependencies:** Task 3.1, Task 3.2 (for fetching full trip by slug), Task 1.x (TerraCard, TerraButton, InfoRow, SectionHeader, StatusBadge).
**Acceptance criteria:**
- Parallax hero scrolls with correct offset effect.
- Each category renders its unique detail sections.
- Car date picker updates duration and price dynamically.
- Cruise cabin selector updates price breakdown when tier changes.
- CTA navigates to CheckoutRouter with correct trip context.

### Task 3.7 — SearchView

**Files:** `Views/Explore/SearchView.swift` (presented by the Search tab)
**Produces:** Search screen with a `TextField` bound to a search query string, debounced at 300ms. Filters `tripStore.trips` by name (case-insensitive contains). Optional category filter chips below the search bar (All / Tours / Cars / Cruises). Results displayed as a list of `TripCardView` items. Empty state: "No trips match your search" with the query echoed back. Tap navigates to `TripDetailView` via the Search tab's own `NavigationStack` path.
**Dependencies:** Task 3.3, Task 3.5.
**Acceptance criteria:**
- Typing filters results after 300ms debounce.
- Category chips further narrow results.
- Empty search shows all trips (or category-filtered subset).
- Navigation works independently from the Home tab's stack.
