# TERRA iOS — Task List

## Section 1: Project Foundation & Theme
- [ ] 1.1 Create folder structure
- [ ] 1.2 Bundle Inter font
- [ ] 1.3 TerraColors — Color palette (12 tokens, WCAG verified)
- [ ] 1.4 TerraTypography — Font styles (6 levels)
- [ ] 1.5 TerraSpacing — Spacing scale
- [ ] 1.6 Shared components (TerraCard, TerraButton, StatusBadge, InfoRow, SectionHeader)
- [ ] 1.7 PayPalButton component
- [ ] 1.8 APIClient — Base networking layer

## Section 2: Auth, Navigation Shell & Profile
- [ ] 2.1 User model
- [ ] 2.2 AuthStore
- [ ] 2.3 Tab enum & NavigationDestination
- [ ] 2.4 LoginView
- [ ] 2.5 ProfileView with role switcher
- [ ] 2.6 ContentView (TabView + NavigationStack + iPad)

## Section 3: Trip Browsing — Explore & Search
- [ ] 3.1 Trip model & SwiftData schema
- [ ] 3.2 TripService
- [ ] 3.3 TripStore with SwiftData caching
- [ ] 3.4 ExploreTabView & TripListView
- [ ] 3.5 TripCardView
- [ ] 3.6 TripDetailView with category-specific layouts
- [ ] 3.7 SearchView

## Section 4: Payment Flows — Checkout & PayPal
- [ ] 4.1 OrderService, VaultService, InvoiceService
- [ ] 4.2 PayPalManager singleton
- [ ] 4.3 CheckoutRouter
- [ ] 4.4 ProcessingOverlay
- [ ] 4.5 ConfirmationView
- [ ] 4.6 AuthorizeCheckoutView (Flow 1)
- [ ] 4.7 VaultCheckoutView (Flow 2)
- [ ] 4.8 InstantCheckoutView (Flow 4)
- [ ] 4.9 InvoiceRequestView (Flow 3)
- [ ] 4.10 PayLaterMessage component

## Section 5: Customer Bookings
- [ ] 5.1 BookingService & BookingStore
- [ ] 5.2 BookingCardView
- [ ] 5.3 BookingListView & EmptyStateView
- [ ] 5.4 PaymentTimeline component
- [ ] 5.5 BookingDetailView

## Section 6: Merchant Features
- [ ] 6.1 MerchantService
- [ ] 6.2 MerchantHomeView with KPI cards
- [ ] 6.3 MerchantBookingListView with filters
- [ ] 6.4 MerchantBookingDetailView
- [ ] 6.5 CaptureBalanceView (Flow 1)
- [ ] 6.6 ChargeAddonSheet (Flow 2)

## Section 7: Polish, Accessibility & Testing
- [ ] 7.1 Skeleton loading states
- [ ] 7.2 ErrorBanner & retry pattern
- [ ] 7.3 Haptics & touch target verification
- [ ] 7.4 Accessibility — VoiceOver & reduce motion
- [ ] 7.5 Dynamic Type & iPad layout verification
- [ ] 7.6 Animation polish
- [ ] 7.7 E2E PayPal sandbox testing & debug settings
