import Foundation

struct MerchantActionResponse: Decodable, Sendable {
    let status: String
    let captureId: String?
    let amountCaptured: Double?
}

final class MerchantService {
    private let apiClient: APIClient

    init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
    }

    func fetchStats() async throws -> MerchantStats {
        try await apiClient.request(method: .get, path: "/api/merchant/stats")
    }

    func fetchAllBookings() async throws -> [Booking] {
        try await apiClient.request(method: .get, path: "/api/bookings")
    }

    func captureBalance(authorizationId: String) async throws -> MerchantActionResponse {
        try await apiClient.request(method: .post, path: "/api/payments/authorizations/\(authorizationId)/capture")
    }

    func voidAuth(authorizationId: String) async throws -> MerchantActionResponse {
        try await apiClient.request(method: .post, path: "/api/payments/authorizations/\(authorizationId)/void")
    }
}
