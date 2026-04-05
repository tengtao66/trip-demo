# TERRA iOS — Debug Log

## 2026-04-05 — Build Issues During Implementation

### 1. WebP images not loading in Asset Catalog
**Symptom:** Only JPG trip images (euro2.jpg, car-rental-luxury.jpg) loaded. All WebP images showed gradient fallback only.
**Root cause:** Xcode Asset Catalog `.imageset` does not support WebP format. Only PNG, JPEG, HEIF, and PDF are supported. WebP files are silently ignored.
**Fix:** Converted all WebP images to JPEG using `sips -s format jpeg` (macOS built-in). Updated Contents.json filenames.

### 2. SF Symbol "ship" does not exist
**Symptom:** Console warning "No symbol named 'ship' found in system symbol set"
**Root cause:** `"ship"` is not a valid SF Symbol name.
**Fix:** Replaced with `"wave.3.right"`.

### 3. `IOSurfaceClientSetSurfaceNotify failed e00002c7`
**Symptom:** Console warning on simulator.
**Root cause:** Harmless simulator-only message. Can be ignored.

### 4. SwiftUI `Tab` name collision with iOS 18+
**Symptom:** SourceKit errors showing `Tab<Value, Content, Label>` — Xcode confused our `enum Tab` with SwiftUI's `Tab` view type introduced in iOS 18.
**Root cause:** Name collision between project's `enum Tab` and `SwiftUI.Tab`.
**Fix:** Renamed to `enum TerraTab`.

### 5. `SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor` missing from test target
**Symptom:** Test target compiled under different concurrency rules than app target, causing actor isolation mismatches and mock failures.
**Root cause:** Xcode auto-creates test targets with default settings. The app target had `SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor` but the test target did not.
**Fix:** Added `SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor` to both Debug and Release configs of the test target in project.pbxproj.

### 6. URLProtocol-based mocking broken under Swift 6
**Symptom:** All mock-dependent APIClient tests failed with `.decodingError("The data couldn't be read because it isn't in the correct format.")`. MockURLProtocol handler was never called.
**Root cause:** Under `SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor`, `MockURLProtocol` class was implicitly MainActor-isolated. `startLoading()` runs on URLSession's background queue, not MainActor. The `static var requestHandler` was either not accessible or the mock class couldn't override URLProtocol methods correctly across actor boundaries.
**Fix:** Abandoned URLProtocol approach entirely. Created `HTTPDataProvider` protocol in APIClient.swift with `URLSession` conformance. Tests use `MockHTTPClient` that implements the protocol directly — no threading issues since everything stays on MainActor.

### 7. `Sendable` conformance on `APIError` with `Error` associated value
**Symptom:** Build error: `associated value 'networkError' of 'Sendable'-conforming enum has non-sendable type 'any Error'`
**Root cause:** `Error` protocol is not `Sendable`. Wrapping `any Error` in a `Sendable` enum violates Swift 6 strict concurrency.
**Fix:** Changed `APIError.networkError(Error)` → `APIError.networkError(String)` storing only the localized description.

### 8. API contract mismatches between iOS client and Express server
**Issues found during code review:**
- Order create path: `/api/orders` → `/api/orders/create`
- Request field: `tripSlug` → `slug` (server uses `req.body.slug`)
- Response field: `orderId` → `id` (server returns `{ id: ... }`)
- Capture response: `CaptureResponse` fields didn't match server (authorize returns different shape than capture)
- Invoice create path: `/api/invoices` → `/api/invoices/create`, field: `requestId` → `tripRequestId`
- Invoice request missing `email` field (server requires it)
- Merchant capture/void paths: `/api/orders/:id/capture` → `/api/payments/authorizations/:authId/capture`
- Merchant fetchAllBookings: `/api/merchant/bookings` (doesn't exist) → `/api/bookings`
**Fix:** Corrected all paths, field names, and response models. Created separate `OrderActionResponse` and `MerchantActionResponse` types.

### 9. `NumberFormatter` not thread-safe as static let
**Symptom:** Potential data race under concurrent access (identified in code review).
**Fix:** Replaced with `Double.formatted(.currency(code: "USD"))` which is thread-safe.

### 10. PayPal SDK `PayPalMessageOfferType` enum values
**Symptom:** Build error: `Type 'PayPalMessageOfferType?' has no member 'payLaterPayIn4'`
**Root cause:** Assumed enum case name. Actual SDK cases: `.payLaterShortTerm`, `.payLaterLongTerm`, `.payLaterPayIn1`, `.payPalCreditNoInterest`.
**Fix:** Changed to `.payLaterShortTerm`.

### 11. Info.plist conflict: "Multiple commands produce Info.plist"
**Symptom:** Build error when `GENERATE_INFOPLIST_FILE = YES` and a custom Info.plist exists in the file-synced directory.
**Root cause:** `PBXFileSystemSynchronizedRootGroup` auto-includes Info.plist as a resource, conflicting with the auto-generated one.
**Fix:** Added `PBXFileSystemSynchronizedBuildFileExceptionSet` to exclude Info.plist from the file sync's resource copy.

### 12. `@Bindable` required for `@Observable` + `@Environment` with bindings
**Symptom:** Cannot create `$` bindings from `@Environment(AuthStore.self)`.
**Root cause:** `@Environment` returns a read-only value. To create bindings, must re-declare as `@Bindable var authStore = authStore` inside the computed property body.
**Fix:** Added `@Bindable` local re-binding pattern in all views that need `$` bindings.

### 13. Double mutation in role switcher
**Symptom:** Role picker bound to `$authStore.role` + `.onChange` calling `switchRole()` — double mutation.
**Root cause:** Direct binding writes the property without triggering nav reset/persistence. The `.onChange` handler calls `switchRole` which writes it again.
**Fix:** Replaced with custom `Binding(get:set:)` that calls `switchRole` directly. Removed `.onChange`.

### 14. `.navigationDestination` placed outside `NavigationStack`
**Symptom:** Console warning: "The `navigationDestination` modifier only works inside a `NavigationStack`"
**Root cause:** `.navigationDestination(for:)` was chained after the `NavigationStack { }` closing brace, not on a view inside it.
**Fix:** Wrapped switch content in `Group { }` and placed `.navigationDestination` on the Group inside the NavigationStack.
