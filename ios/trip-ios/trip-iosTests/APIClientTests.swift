import Testing
import Foundation
@testable import trip_ios

@Suite("APIClient", .serialized)
@MainActor
struct APIClientTests {

    // T1.8.1: Default baseURL is localhost:3001
    @Test func defaultBaseURL() {
        let client = APIClient()
        #expect(client.baseURL.absoluteString == "http://localhost:3001")
    }

    // T1.8.2: Reads UserDefaults override for baseURL
    @Test func userDefaultsOverrideBaseURL() {
        let suiteName = "test-api-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { UserDefaults.standard.removePersistentDomain(forName: suiteName) }
        defaults.set("http://192.168.1.100:3001", forKey: "terra_base_url")
        let client = APIClient(userDefaults: defaults)
        #expect(client.baseURL.absoluteString == "http://192.168.1.100:3001")
    }

    // T1.8.3: Adds X-User-Role header to requests
    @Test func requestAddsUserRoleHeader() async throws {
        let mock = MockHTTPClient.returning(json: "{}")
        let client = APIClient(httpProvider: mock)
        client.userRole = "merchant"
        let _: [String: String] = try await client.request(method: .get, path: "/api/test")
        #expect(mock.lastRequest?.value(forHTTPHeaderField: "X-User-Role") == "merchant")
    }

    // T1.8.4: Adds Content-Type header
    @Test func requestAddsContentTypeHeader() async throws {
        let mock = MockHTTPClient.returning(json: "{}")
        let client = APIClient(httpProvider: mock)
        let _: [String: String] = try await client.request(method: .get, path: "/api/test")
        #expect(mock.lastRequest?.value(forHTTPHeaderField: "Content-Type") == "application/json")
    }

    // T1.8.5: Decodes snake_case JSON via APIClient.request()
    @Test func requestDecodesSnakeCase() async throws {
        struct TestTrip: Decodable, Sendable {
            let basePrice: Double
            let durationDays: Int
        }
        let mock = MockHTTPClient.returning(json: "{\"base_price\": 800.0, \"duration_days\": 5}")
        let client = APIClient(httpProvider: mock)
        let trip: TestTrip = try await client.request(method: .get, path: "/api/test")
        #expect(trip.basePrice == 800.0)
        #expect(trip.durationDays == 5)
    }

    // T1.8.7: 500 response throws .serverError
    @Test func serverErrorThrowsCorrectly() async {
        let mock = MockHTTPClient.returningError(statusCode: 500, message: "Internal server error")
        let client = APIClient(httpProvider: mock)
        do {
            let _: [String: String] = try await client.request(method: .get, path: "/api/fail")
            Issue.record("Expected serverError to be thrown")
        } catch let error as APIError {
            if case .serverError(let code, let message) = error {
                #expect(code == 500)
                #expect(message == "Internal server error")
            } else {
                Issue.record("Expected serverError case, got \(error)")
            }
        } catch {
            Issue.record("Expected APIError, got \(error)")
        }
    }

    // T1.8.8: Invalid JSON throws .decodingError
    @Test func invalidJSONThrowsDecodingError() async {
        struct StrictModel: Decodable, Sendable { let requiredField: String }
        let mock = MockHTTPClient.returning(json: "not json")
        let client = APIClient(httpProvider: mock)
        do {
            let _: StrictModel = try await client.request(method: .get, path: "/api/bad")
            Issue.record("Expected decodingError to be thrown")
        } catch let error as APIError {
            if case .decodingError = error {
                // expected
            } else {
                Issue.record("Expected decodingError case, got \(error)")
            }
        } catch {
            Issue.record("Expected APIError, got \(error)")
        }
    }

    // T1.8.10: APIError.localizedDescription is human-readable
    @Test func apiErrorHasReadableDescription() {
        let error = APIError.serverError(statusCode: 500, message: "Internal server error")
        let desc = error.localizedDescription
        #expect(desc.contains("500"))
        #expect(!desc.isEmpty)
    }

    // T1.8.6: Network error stores description string
    @Test func networkErrorStoresDescription() {
        let apiError = APIError.networkError("The Internet connection appears to be offline.")
        if case .networkError(let message) = apiError {
            #expect(message.contains("offline"))
        } else {
            Issue.record("Expected networkError case")
        }
    }
}
