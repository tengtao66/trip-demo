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
        } catch is CancellationError {
            // Task cancelled by SwiftUI (e.g. view transition) — ignore
            return
        } catch let apiError as APIError {
            if case .networkError(let msg) = apiError, msg.contains("cancelled") {
                return // URLSession cancelled — not a real error
            }
            error = apiError
        } catch {
            let desc = error.localizedDescription
            if desc.contains("cancelled") { return }
            self.error = .networkError(desc)
        }
        isLoading = false
    }

    func refresh() async {
        await loadTrips()
    }
}
