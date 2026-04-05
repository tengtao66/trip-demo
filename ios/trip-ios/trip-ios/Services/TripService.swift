import Foundation

final class TripService {
    private let apiClient: APIClient

    init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
    }

    func fetchTrips() async throws -> [Trip] {
        try await apiClient.request(method: .get, path: "/api/trips")
    }

    func fetchTrip(slug: String) async throws -> Trip {
        try await apiClient.request(method: .get, path: "/api/trips/\(slug)")
    }
}
