import Foundation

struct TripRequestBody: Encodable, Sendable {
    let email: String
    let destinations: [String]
    let activities: [String]
    let startDate: String
    let endDate: String
    let notes: String?
}

struct TripRequestResponse: Decodable, Sendable {
    let id: String
    let bookingId: String?
    let bookingReference: String?
    let totalEstimate: Double?
    let depositAmount: Double?
    let balanceAmount: Double?
    let invoiceUrl: String?
    let status: String
}

struct InvoiceResponse: Decodable, Sendable {
    let invoiceId: String?
    let invoiceUrl: String?
    let status: String
}

struct InvoiceStatusResponse: Decodable, Sendable {
    let status: String
    let invoiceId: String?
}

final class InvoiceService {
    private let apiClient: APIClient

    init(apiClient: APIClient = APIClient()) {
        self.apiClient = apiClient
    }

    func createTripRequest(email: String, destinations: [String], activities: [String], startDate: String, endDate: String, notes: String?) async throws -> TripRequestResponse {
        let body = TripRequestBody(email: email, destinations: destinations, activities: activities, startDate: startDate, endDate: endDate, notes: notes)
        return try await apiClient.request(method: .post, path: "/api/trip-requests", body: body)
    }

    func createInvoice(tripRequestId: String) async throws -> InvoiceResponse {
        try await apiClient.request(method: .post, path: "/api/invoices/create", body: ["tripRequestId": tripRequestId])
    }

    func sendInvoice(id: String) async throws -> InvoiceResponse {
        try await apiClient.request(method: .post, path: "/api/invoices/\(id)/send")
    }

    func pollInvoiceStatus(id: String, maxRetries: Int = 60, interval: TimeInterval = 5) async throws -> InvoiceStatusResponse {
        for _ in 0..<maxRetries {
            let status: InvoiceStatusResponse = try await apiClient.request(method: .get, path: "/api/invoices/\(id)/status")
            if status.status == "PAID" {
                return status
            }
            try await Task.sleep(for: .seconds(interval))
        }
        throw APIError.serverError(statusCode: 408, message: "Invoice payment timed out")
    }
}
