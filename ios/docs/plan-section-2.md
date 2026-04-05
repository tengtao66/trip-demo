# Section 2: Auth, Navigation Shell & Profile

> Depends on: Section 1 (TerraColors, TerraButton, TerraCard, APIClient)

---

### Task 2.1 — User Model

- **Files**: `Models/User.swift`
- **Output**: `User` struct — `Codable`, properties: `id`, `name`, `email`, `avatarInitials` (computed). `UserRole` enum (`.customer`, `.merchant`) with `Codable` conformance.
- **Dependencies**: None
- **Acceptance criteria**: `User` round-trips through `JSONEncoder`/`JSONDecoder`. `UserRole` raw values match server `X-User-Role` header values (`"customer"`, `"merchant"`).

### Task 2.2 — AuthStore

- **Files**: `Stores/AuthStore.swift`
- **Output**: `@Observable class AuthStore` with: `currentUser: User?`, `role: UserRole`, `isLoggedIn: Bool` (computed), `navigationPaths: [Tab: NavigationPath]`. Methods: `login(user:role:)`, `logout()`, `switchRole(_:)`. `switchRole` resets all `navigationPaths` to empty and sets `selectedTab` to `.home`. Persists `currentUser` and `role` to `UserDefaults` via `Codable` encoding; restores on init.
- **Dependencies**: Task 2.1 (User model), Task 2.3 (Tab enum)
- **Acceptance criteria**: After `switchRole(.merchant)`, every path in `navigationPaths` is empty and `selectedTab == .home`. After `logout()`, `currentUser` is nil and `UserDefaults` keys are cleared. State survives app relaunch via `UserDefaults`.

### Task 2.3 — Tab Enum & Navigation Destination

- **Files**: `App/ContentView.swift` (partial — enum declarations only)
- **Output**: `enum Tab: String, CaseIterable, Hashable` — `.home`, `.search`, `.bookings`, `.profile` with `sfSymbol: String` and `label: String` properties. `enum NavigationDestination: Hashable` with cases: `.tripDetail(slug: String)`, `.checkout(slug: String)`, `.bookingDetail(id: String)`, `.merchantBookingDetail(id: String)`.
- **Dependencies**: None
- **Acceptance criteria**: `Tab.allCases` returns all 4 tabs. All `NavigationDestination` cases are `Hashable`.

### Task 2.4 — LoginView

- **Files**: `Views/Profile/LoginView.swift`
- **Output**: View with a `Picker` listing pre-seeded users (hardcoded array of 3-4 `User` values). Two buttons: "Login as Customer" and "Login as Merchant". Calls `authStore.login(user:role:)` and sets `selectedTab = .home`. Uses `TerraButton` (primary variant) and `TerraCard` for the form container. TERRA branding header with app name.
- **Dependencies**: Task 2.1, 2.2, Section 1 (TerraButton, TerraCard, TerraColors)
- **Acceptance criteria**: Tapping "Login as Customer" sets `authStore.role == .customer` and `authStore.isLoggedIn == true`. View navigates away from Profile tab to Home tab.

### Task 2.5 — ProfileView with Role Switcher

- **Files**: `Views/Profile/ProfileView.swift`
- **Output**: Displays user avatar (initials circle in `terraTerracotta`), name, email. `Picker` with `.segmented` style for Customer/Merchant role switch — calls `authStore.switchRole(_:)`. Logout button (`TerraButton` destructive variant) calls `authStore.logout()`. Conditionally shows `LoginView` when `!authStore.isLoggedIn`, otherwise shows profile content.
- **Dependencies**: Task 2.2, 2.4, Section 1 (TerraButton, TerraColors, TerraTypography)
- **Acceptance criteria**: Switching role resets navigation (verified via `authStore.navigationPaths`). Logout returns to `LoginView`. Initials circle renders first letters of first and last name.

### Task 2.6 — ContentView (TabView + NavigationStack + iPad)

- **Files**: `App/ContentView.swift`
- **Output**: `ContentView` reads `authStore` from environment. On iPhone (`horizontalSizeClass == .compact`): `TabView(selection: $authStore.selectedTab)` with 4 tabs, each wrapping its content in `NavigationStack(path: $authStore.navigationPaths[tab])` with `.navigationDestination(for: NavigationDestination.self)` routing. On iPad (`horizontalSizeClass == .regular`): `NavigationSplitView` with sidebar listing tabs as `NavigationLink` items and detail column showing tab content with its own `NavigationStack`. Placeholder views for Home/Search/Bookings content (real views come in Sections 3-5). Profile tab uses `ProfileView`. Inject `AuthStore` via `.environment()` in `TerraApp.swift`.
- **Dependencies**: Task 2.2, 2.3, 2.5
- **Acceptance criteria**: All 4 tabs visible and tappable on iPhone. iPad shows sidebar + detail. Role switch resets all navigation paths (no stale detail views). `NavigationDestination` routing resolves without crashes (placeholder views for unimplemented destinations). `AuthStore` is accessible via `@Environment` in all child views.
