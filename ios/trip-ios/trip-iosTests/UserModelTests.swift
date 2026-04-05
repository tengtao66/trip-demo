import Testing
import Foundation
@testable import trip_ios

// MARK: - T2.1 User Model Tests

@Suite("User Model")
@MainActor
struct UserModelTests {

    // T2.1.1: User decodes from JSON
    @Test func userDecodesFromJSON() throws {
        let json = """
        {"id": "u1", "name": "John Doe", "email": "john@test.com"}
        """.data(using: .utf8)!
        let user = try JSONDecoder().decode(User.self, from: json)
        #expect(user.id == "u1")
        #expect(user.name == "John Doe")
        #expect(user.email == "john@test.com")
    }

    // T2.1.2: avatarInitials for "John Doe" returns "JD"
    @Test func avatarInitialsFullName() {
        let user = User(id: "u1", name: "John Doe", email: "j@t.com")
        #expect(user.avatarInitials == "JD")
    }

    // T2.1.3: avatarInitials for single name returns first letter
    @Test func avatarInitialsSingleName() {
        let user = User(id: "u1", name: "Madonna", email: "m@t.com")
        #expect(user.avatarInitials == "M")
    }

    // T2.1.4: avatarInitials for empty name returns ""
    @Test func avatarInitialsEmptyName() {
        let user = User(id: "u1", name: "", email: "e@t.com")
        #expect(user.avatarInitials == "")
    }

    // T2.1.5: UserRole raw values match server headers
    @Test func userRoleRawValues() {
        #expect(UserRole.customer.rawValue == "customer")
        #expect(UserRole.merchant.rawValue == "merchant")
    }

    // T2.1.6: UserRole round-trips through JSON
    @Test func userRoleRoundTrips() throws {
        let encoder = JSONEncoder()
        let decoder = JSONDecoder()
        let data = try encoder.encode(UserRole.merchant)
        let decoded = try decoder.decode(UserRole.self, from: data)
        #expect(decoded == .merchant)
    }
}
