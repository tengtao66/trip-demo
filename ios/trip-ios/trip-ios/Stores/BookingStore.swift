import Foundation
import Observation

@Observable
final class BookingStore {
    var bookings: [Booking] = []
    var isLoading = false
    var error: APIError?

    private let bookingService: BookingService

    init(bookingService: BookingService = BookingService()) {
        self.bookingService = bookingService
    }

    func loadBookings() async {
        isLoading = true
        error = nil
        do {
            bookings = try await bookingService.fetchBookings()
        } catch is CancellationError {
            return
        } catch let apiError as APIError {
            if case .networkError(let msg) = apiError, msg.contains("cancelled") { return }
            error = apiError
        } catch {
            let desc = error.localizedDescription
            if desc.contains("cancelled") { return }
            self.error = .networkError(desc)
        }
        isLoading = false
    }

    func refresh() async {
        await loadBookings()
    }
}
