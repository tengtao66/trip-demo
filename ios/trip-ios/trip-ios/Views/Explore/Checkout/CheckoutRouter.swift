import SwiftUI

struct CheckoutRouter: View {
    let trip: Trip
    var pickupDate: Date?
    var dropoffDate: Date?
    @Environment(AuthStore.self) private var authStore
    @State private var showConfirmation = false
    @State private var bookingResult: BookingResult?
    @State private var pendingNavigation: TerraTab?

    var body: some View {
        Group {
            switch trip.paymentFlow {
            case .authorize:
                AuthorizeCheckoutView(trip: trip, onComplete: handleComplete)
            case .vault:
                VaultCheckoutView(trip: trip, onComplete: handleComplete)
            case .instant:
                InstantCheckoutView(
                    trip: trip,
                    onComplete: handleComplete,
                    pickupDate: pickupDate ?? Date(),
                    dropoffDate: dropoffDate ?? Calendar.current.date(byAdding: .day, value: 3, to: Date())!
                )
            case .invoice:
                InvoiceRequestView(trip: trip, onComplete: handleComplete)
            }
        }
        .fullScreenCover(isPresented: $showConfirmation, onDismiss: {
            if let nav = pendingNavigation {
                authStore.selectedTab = nav
                authStore.navigationPaths[.home] = []
                pendingNavigation = nil
            }
        }) {
            if let result = bookingResult {
                ConfirmationView(
                    result: result,
                    onViewBookings: {
                        pendingNavigation = .bookings
                        showConfirmation = false
                    },
                    onBackToHome: {
                        pendingNavigation = .home
                        showConfirmation = false
                    }
                )
            }
        }
    }

    private func handleComplete(result: BookingResult) {
        HapticFeedback.success()
        bookingResult = result
        showConfirmation = true
    }
}
