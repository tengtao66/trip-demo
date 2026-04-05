# TERRA iOS App — Project Context

## Goal
Native SwiftUI iOS app for the TERRA trip booking demo. Mirrors the web app's customer and lite-merchant experience with all 4 PayPal payment flows.

## Tech Stack
- SwiftUI (iOS 17+), Swift 6
- @Observable macro for state management
- SwiftData for offline trip caching
- PayPal iOS SDK (SPM) for native checkout
- URLSession async/await networking
- Connects to existing Express backend (shared with web app)

## Key Decisions
- 4-tab navigation: Home, Search, Bookings, Profile (matches storyboards)
- Merchant features embedded in Bookings tab header (no separate tab)
- iPad adaptive via NavigationSplitView
- WCAG AA contrast-verified color palette with text-safe variants
- Spring animations gated on accessibilityReduceMotion

## Key Files
- Design spec: `ios/docs/superpowers/specs/2026-04-05-terra-ios-app-design.md`
- Implementation plan: `ios/docs/implementation-plan.md`
- UI storyboards: `ios/docs/ui/*.html` (3 flow references)
- Xcode project: `ios/trip-ios/`
