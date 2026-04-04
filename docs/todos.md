# TERRA Trip Demo — Remaining Tasks

## Section 8: Polish & Integration Testing
- [ ] Error banners (PaymentErrorBanner component for PayPal API failures)
- [ ] Skeleton screens for trip cards, booking lists, dashboard charts
- [ ] ProcessingOverlay component for payment processing
- [ ] Confirmation dialogs (replace window.confirm with shadcn AlertDialog) for: Capture Balance, Void, Delete Vault, Final Settlement
- [ ] Toast notifications after all payment actions (using sonner or shadcn Toast)
- [ ] Authorization progress bar (horizontal bar showing position in 29-day window)
- [ ] Loading spinners on action buttons during API calls
- [ ] Back navigation links on all detail pages
- [ ] Responsive layout (mobile breakpoints for trip cards, dashboard charts)
- [ ] E2E testing of all 3 flows in PayPal sandbox
- [ ] Edge cases: authorization expiration warning, vault charge failure retry, empty states

## Known Issues to Address
- [ ] `window.confirm` used in FinalSettlementButton and VaultBookingDetailPage — replace with AlertDialog
- [ ] No toast library installed — add sonner or shadcn toast
- [ ] RecentBookingsTable fetches without limit/sort params
- [ ] Invoice flow: InvoiceDetailPage fetches all trip requests to find match (O(n) scan)
- [ ] STATUS_LABELS duplicated across BookingsPage, BookingDetailPage, MerchantBookingsPage — extract to shared constants
- [ ] tripImages mapping duplicated in TripCard, TripDetailPage, CheckoutAuthorizePage, CheckoutVaultPage, BookingsPage, BookingDetailPage — extract to shared constants

## Completed
- [x] Section 1: Project Scaffolding & Infrastructure
- [x] Section 2: Auth & Layout Shell
- [x] Section 3: Trip Listing & Detail Pages
- [x] Section 4: Flow 1 — Authorize & Capture
- [x] Section 5: Flow 2 — Vaulting
- [x] Section 6: Flow 3 — Invoice
- [x] Section 7: Merchant Dashboard

## New Services (2026-04-03)
- [x] Extract shared constants (tripImages, STATUS_LABELS)
- [x] Schema & seed data (category, daily_rate, 6 new products)
- [x] Homepage tabbed layout (Tours / Car Rentals / Cruises)
- [x] Car rental detail page (date picker, live total, Pay Later message)
- [x] CheckoutInstantPage (standalone PayPal + Pay Later buttons)
- [x] Server-side instant capture flow
- [x] Cruise integration verification
- [x] Booking detail & merchant dashboard updates (CONFIRMED status)
- [x] UX polish (contrast, focus styles, cancellation policy, responsive)
