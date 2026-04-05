import Foundation

struct CreateOrderRequest: Encodable, Sendable {
    let slug: String
    let intent: String
    let pickupDate: String?
    let dropoffDate: String?
    let cabinType: String?
}

struct OrderResponse: Decodable, Sendable {
    let id: String
    let bookingId: String?
    let bookingReference: String?
}

struct OrderActionResponse: Decodable, Sendable {
    let bookingId: String
    let bookingReference: String
    let status: String?
    let captureId: String?
    let amount: Double?
    let depositAmount: Double?
    let totalAmount: Double?
    let balanceRemaining: Double?
    let vaultTokenId: String?
}

final class OrderService {
    private let apiClient: APIClient

    init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
    }

    func createOrder(slug: String, intent: String, pickupDate: String? = nil, dropoffDate: String? = nil, cabinType: String? = nil) async throws -> OrderResponse {
        let body = CreateOrderRequest(slug: slug, intent: intent, pickupDate: pickupDate, dropoffDate: dropoffDate, cabinType: cabinType)
        return try await apiClient.request(method: .post, path: "/api/orders/create", body: body)
    }

    func authorizeOrder(id: String) async throws -> OrderActionResponse {
        try await apiClient.request(method: .post, path: "/api/orders/\(id)/authorize")
    }

    func captureOrder(id: String) async throws -> OrderActionResponse {
        try await apiClient.request(method: .post, path: "/api/orders/\(id)/capture")
    }
}
