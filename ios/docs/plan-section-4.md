# Section 4: Payment Flows — Checkout & PayPal

> 10 tasks. Depends on: Section 1 (components, APIClient), Section 3 (TripDetailView, Trip model).

---

### Task 4.1 — OrderService & InvoiceService

**Files:** `Services/OrderService.swift`, `Services/InvoiceService.swift`, `Services/VaultService.swift`
**Produces:** Networking layer for all payment operations.
**Dependencies:** Section 1 (APIClient)
**Details:**
- `OrderService`: `createOrder(tripSlug:intent:extras:)` → POST `/api/orders`, `authorizeOrder(id:)` → POST `/api/orders/:id/authorize`, `captureOrder(id:)` → POST `/api/orders/:id/capture`. All return Decodable response models.
- `VaultService`: `chargeVault(token:amount:description:)` → POST `/api/vault/charge`, `deleteVault(token:)` → DELETE `/api/vault/:token`.
- `InvoiceService`: `createTripRequest(destinations:activities:dates:notes:)` → POST `/api/trip-requests`, `createInvoice(requestId:)` → POST `/api/invoices`, `sendInvoice(id:)` → POST `/api/invoices/:id/send`, `pollInvoiceStatus(id:)` → GET `/api/invoices/:id/status` with 5-second polling interval, max 60 retries.
**Acceptance criteria:** Each method compiles, uses async/await, returns typed response models, and propagates `APIError`.

---

### Task 4.2 — PayPalManager Singleton

**Files:** `Services/PayPalManager.swift`, `App/TerraApp.swift`, `Info.plist`
**Produces:** PayPal SDK wrapper that creates orders on the server and presents the native PayPal sheet.
**Dependencies:** Task 4.1 (OrderService)
**Details:**
- Add `PayPalCheckout` SPM package. Configure SDK in `TerraApp.init` with sandbox client ID and `.sandbox` environment.
- Register URL scheme `terra-ios` in Info.plist (`CFBundleURLSchemes`).
- `PayPalManager` is `@Observable` with `isProcessing: Bool` and `error: PayPalError?`.
- `startCheckout(tripSlug:intent:extras:) async throws -> BookingResult`: (1) POST to server to create order and get orderID, (2) call `Checkout.start(...)` with `onApprove`, `onCancel`, `onError` callbacks, (3) on approve, call authorize or capture endpoint, (4) return `BookingResult` with ref, status, amounts.
- `onCancel`: dismiss sheet silently, user stays on checkout.
- `onError`: set `error` property, checkout view shows `ErrorBanner`.
**Acceptance criteria:** SDK initializes without crash. `startCheckout` compiles with correct callback signatures. URL scheme registered.

---

### Task 4.3 — CheckoutRouter

**Files:** `Views/Explore/Checkout/CheckoutRouter.swift`
**Produces:** View that reads `trip.payment_flow` and dispatches to the correct checkout view.
**Dependencies:** Section 3 (Trip model)
**Details:**
- Switch on `trip.paymentFlow`: `.authorize` -> `AuthorizeCheckoutView`, `.vault` -> `VaultCheckoutView`, `.invoice` -> `InvoiceRequestView`, `.instant` -> `InstantCheckoutView`.
- Receives `trip: Trip` and bindings for `showConfirmation: Bool` and `bookingResult: BookingResult?`.
- Manages `@State var showProcessing: Bool` and passes it to child views.
**Acceptance criteria:** All four branches compile and render the correct child view. Unknown flow shows an error fallback.

---

### Task 4.4 — ProcessingOverlay

**Files:** `Views/Shared/ProcessingOverlay.swift`
**Produces:** Full-screen dimmed overlay with spinner modal, used by all checkout flows.
**Dependencies:** Section 1 (TerraColors, TerraTypography)
**Details:**
- ZStack overlay: dimmed background (`Color.black.opacity(0.5)`), centered white card with `ProgressView`, title ("Processing Payment..."), subtitle ("Please don't close this screen").
- Blocks all interaction (`.allowsHitTesting(false)` on content beneath).
- Controlled by `isPresented: Binding<Bool>`.
- Per storyboards: spinner uses terracotta accent, card has 20pt corner radius.
**Acceptance criteria:** Overlay renders centered, blocks taps on content below, animates in/out.

---

### Task 4.5 — ConfirmationView

**Files:** `Views/Shared/ConfirmationView.swift`
**Produces:** Full-screen success view shown via `.fullScreenCover` after any payment completes.
**Dependencies:** Section 1 (components), Task 4.1 (BookingResult model)
**Details:**
- Sage checkmark circle (56pt), title ("Deposit Authorized!" / "Booking Confirmed!" / "Bon Voyage!"), booking ref (`TERRA-XXXX`).
- TerraCard with flow-specific details: deposit/balance for authorize, total paid for instant, vault status for vault, request submitted for invoice.
- Step indicator for authorize flow (1 of 2 dots).
- "View My Bookings" primary CTA: dismisses `.fullScreenCover`, resets nav path to root, switches tab to Bookings.
- "Back to Home" ghost button as secondary action.
- Per storyboard screens 5: no back button in nav bar, presented modally.
**Acceptance criteria:** Renders correctly for all 4 flow types. "View My Bookings" dismisses cover and navigates to Bookings tab.

---

### Task 4.6 — AuthorizeCheckoutView (Flow 1)

**Files:** `Views/Explore/Checkout/AuthorizeCheckoutView.swift`
**Produces:** Checkout screen for authorize & capture trips (tours).
**Dependencies:** Tasks 4.2, 4.3, 4.4, 4.5
**Details:**
- Nav title "Checkout" with back button.
- Order summary card: trip thumbnail (AsyncImage, 48pt rounded rect) + name + subtitle.
- Fee breakdown card: deposit (charged now, bold), balance (after trip, muted), total (separator + bold).
- Info callout (blue background): "You're authorizing a $200 deposit..."
- PayPal button (FFC439 yellow, PayPal logo, 12pt corner radius). Tapping calls `payPalManager.startCheckout(tripSlug:intent:.authorize:extras:)`.
- "Pay Later with PayPal" link below button (blue, 11pt).
- Terms text at bottom: "Authorization valid for 29 days."
- On tap: show ProcessingOverlay ("Authorizing Deposit..."), on success set `showConfirmation = true`.
- Error: show `ErrorBanner` at top with "Try Again" button.
- Reference: `trip-authorize-flow.html` screen 3.
**Acceptance criteria:** Layout matches storyboard. PayPal button triggers SDK flow. Processing overlay appears during server call. Confirmation shows on success.

---

### Task 4.7 — VaultCheckoutView (Flow 2)

**Files:** `Views/Explore/Checkout/VaultCheckoutView.swift`
**Produces:** Checkout screen for vault/recurring trips.
**Dependencies:** Tasks 4.2, 4.3, 4.4, 4.5
**Details:**
- Order summary card with setup fee.
- "How It Works" card: 3 numbered steps explaining setup fee, add-ons during trip, final settlement.
- Fee breakdown: setup fee (charged now), estimated add-ons, estimated total.
- Info callout explaining vault/recurring billing.
- PayPal button with CAPTURE intent. Extras include `vault.usage_type: "MERCHANT"` and `store_in_vault: "ON_SUCCESS"`.
- No Pay Later link (vault flows are merchant-initiated).
- On success: server captures setup fee and stores vault token. Confirmation shows vault status badge.
- Reference: web app `CheckoutVaultPage.tsx`.
**Acceptance criteria:** Vault extras are passed correctly to `startCheckout`. Confirmation shows vault-specific messaging.

---

### Task 4.8 — InstantCheckoutView (Flow 4)

**Files:** `Views/Explore/Checkout/InstantCheckoutView.swift`
**Produces:** Checkout screen for instant capture trips (car rentals, cruises).
**Dependencies:** Tasks 4.2, 4.3, 4.4, 4.5
**Details:**
- Order summary card with trip thumbnail, name, duration, total price.
- Trip details card: flow-specific fields -- pickup/dropoff dates for cars, cabin type + departure date for cruises.
- Price breakdown: subtotal, tax/fees, total.
- PayPal button (CAPTURE intent).
- Pay Later button (white background, dark border, "PayPal Pay Later" text per car-rental storyboard screen 3).
- Pay Later messaging: "Pay in 4 interest-free payments of $X with PayPal" with "Learn more" link.
- Secure checkout badge at bottom: lock icon + "Secure checkout powered by PayPal".
- On success: full amount captured, confirmation shows total paid + PayPal transaction ID.
- Reference: `car-rental-flow.html` screen 3, `cruise-booking-flow.html` screen 3.
**Acceptance criteria:** Layout adapts for car vs cruise data. Pay Later button and messaging render. Full capture flow works end-to-end.

---

### Task 4.9 — InvoiceRequestView (Flow 3)

**Files:** `Views/Explore/Checkout/InvoiceRequestView.swift`
**Produces:** Multi-step form for custom trip requests (no PayPal payment at this step).
**Dependencies:** Tasks 4.1 (InvoiceService), 4.3, 4.5
**Details:**
- Multi-select destination picker (list with checkmarks).
- Activities list with prices (toggleable items).
- Date picker for travel dates (native SwiftUI `DatePicker`).
- Notes text field (multi-line `TextEditor`).
- "Submit Request" primary button (terracotta, no PayPal branding).
- On submit: POST `/api/trip-requests`, then POST `/api/invoices` and `/api/invoices/:id/send`.
- ProcessingOverlay with "Submitting Request...".
- Confirmation: "Request Submitted" with note that invoice will be emailed.
- No PayPal SDK involvement -- customer pays invoice externally via email link/QR.
- Reference: web app `CheckoutInvoicePage.tsx`.
**Acceptance criteria:** Form validates required fields. Submit creates trip request and invoice on server. Confirmation shows invoice-specific messaging.

---

### Task 4.10 — Pay Later Messaging Component

**Files:** `Views/Shared/PayLaterMessage.swift`
**Produces:** Reusable Pay Later messaging view used by Flow 1 and Flow 4 checkout screens.
**Dependencies:** Section 1 (TerraColors)
**Details:**
- For Flow 4 (instant): standalone Pay Later button (white bg, dark border, 24pt corner radius) + messaging text ("Pay in 4 interest-free payments of $X"). Calculates installment amount from total.
- For Flow 1 (authorize): simple "Pay Later with PayPal" text link (blue, 11pt).
- `PayLaterMessage(total: Double, style: .full | .link)`.
- Not shown for Flow 2 (vault) or Flow 3 (invoice).
- "Learn more" link opens PayPal Pay Later info URL in `SFSafariViewController`.
**Acceptance criteria:** `.full` style renders button + message per car-rental storyboard. `.link` style renders text link per authorize storyboard. Installment math is correct (total / 4, rounded to 2 decimal places).
