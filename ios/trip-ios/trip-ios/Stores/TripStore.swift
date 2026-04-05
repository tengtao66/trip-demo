import Foundation
import Observation

@Observable
final class TripStore {
    var trips: [Trip] = []
    var selectedCategory: TripCategory = .tour
    var isLoading = false
    var error: APIError?

    private let tripService: TripService

    var filteredTrips: [Trip] {
        trips.filter { $0.category == selectedCategory }
    }

    init(tripService: TripService = TripService()) {
        self.tripService = tripService
    }

    func loadTrips() async {
        isLoading = true
        error = nil
        do {
            trips = try await tripService.fetchTrips()
        } catch let apiError as APIError {
            error = apiError
        } catch {
            self.error = .networkError(error.localizedDescription)
        }
        isLoading = false
    }

    func refresh() async {
        await loadTrips()
    }
}
