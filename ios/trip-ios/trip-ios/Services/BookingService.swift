import Foundation

final class BookingService {
    private let apiClient: APIClient

    init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
    }

    func fetchBookings() async throws -> [Booking] {
        try await apiClient.request(method: .get, path: "/api/bookings")
    }

    func fetchBooking(id: String) async throws -> BookingDetail {
        try await apiClient.request(method: .get, path: "/api/bookings/\(id)")
    }
}
