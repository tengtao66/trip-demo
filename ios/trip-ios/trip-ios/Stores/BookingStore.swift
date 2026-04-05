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
        } catch let apiError as APIError {
            error = apiError
        } catch {
            self.error = .networkError(error.localizedDescription)
        }
        isLoading = false
    }

    func refresh() async {
        await loadBookings()
    }
}
