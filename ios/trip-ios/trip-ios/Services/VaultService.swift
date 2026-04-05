import Foundation

struct VaultChargeRequest: Encodable, Sendable {
    let amount: Double
    let description: String
}

struct VaultChargeResponse: Decodable, Sendable {
    let chargeId: String
    let status: String
    let amount: Double
}

final class VaultService {
    private let apiClient: APIClient

    init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
    }

    func chargeVault(bookingId: String, amount: Double, description: String) async throws -> VaultChargeResponse {
        let body = VaultChargeRequest(amount: amount, description: description)
        return try await apiClient.request(method: .post, path: "/api/vault/charge", body: body)
    }

    func deleteVault(token: String) async throws -> [String: String] {
        try await apiClient.request(method: .delete, path: "/api/vault/\(token)")
    }
}
