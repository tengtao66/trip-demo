import Testing
import Foundation
@testable import trip_ios

// MARK: - T2.2 AuthStore Tests

@Suite("AuthStore", .serialized)
@MainActor
struct AuthStoreTests {

    private let suiteName = "test-auth-\(UUID().uuidString)"

    private func makeUser() -> User {
        User(id: "u1", name: "John Doe", email: "john@test.com")
    }

    private func makeStore() -> AuthStore {
        AuthStore(userDefaults: UserDefaults(suiteName: suiteName)!)
    }

    private func cleanup(_ store: AuthStore) {
        store.logout()
        UserDefaults.standard.removePersistentDomain(forName: suiteName)
    }

    // T2.2.1: Starts logged out
    @Test func startsLoggedOut() {
        let store = makeStore()
        defer { cleanup(store) }
        #expect(store.isLoggedIn == false)
    }

    // T2.2.2: After login, isLoggedIn is true
    @Test func loginSetsLoggedIn() {
        let store = makeStore()
        defer { cleanup(store) }
        store.login(user: makeUser(), role: .customer)
        #expect(store.isLoggedIn == true)
    }

    // T2.2.3: After login, currentUser matches
    @Test func loginSetsCurrentUser() {
        let store = makeStore()
        defer { cleanup(store) }
        let user = makeUser()
        store.login(user: user, role: .customer)
        #expect(store.currentUser?.id == user.id)
        #expect(store.currentUser?.name == user.name)
    }

    // T2.2.4: After logout, currentUser is nil
    @Test func logoutClearsUser() {
        let store = makeStore()
        defer { cleanup(store) }
        store.login(user: makeUser(), role: .customer)
        store.logout()
        #expect(store.currentUser == nil)
    }

    // T2.2.5: After logout, isLoggedIn is false
    @Test func logoutSetsLoggedOut() {
        let store = makeStore()
        defer { cleanup(store) }
        store.login(user: makeUser(), role: .customer)
        store.logout()
        #expect(store.isLoggedIn == false)
    }

    // T2.2.6: switchRole sets role
    @Test func switchRoleSetsRole() {
        let store = makeStore()
        defer { cleanup(store) }
        store.login(user: makeUser(), role: .customer)
        store.switchRole(.merchant)
        #expect(store.role == .merchant)
    }

    // T2.2.7: switchRole resets all navigationPaths
    @Test func switchRoleResetsNavigation() {
        let store = makeStore()
        defer { cleanup(store) }
        store.login(user: makeUser(), role: .customer)
        // Simulate adding a nav destination
        store.navigationPaths[.home]?.append(NavigationDestination.tripDetail(slug: "test"))
        store.switchRole(.merchant)
        for (_, path) in store.navigationPaths {
            #expect(path.isEmpty, "Navigation path should be empty after role switch")
        }
    }

    // T2.2.8: switchRole sets selectedTab to .home
    @Test func switchRoleSetsHomeTab() {
        let store = makeStore()
        defer { cleanup(store) }
        store.login(user: makeUser(), role: .customer)
        store.selectedTab = .bookings
        store.switchRole(.merchant)
        #expect(store.selectedTab == .home)
    }

    // T2.2.9: State persists to UserDefaults after login
    @Test func statePersistsAfterLogin() {
        let suiteName = "test-persist-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { UserDefaults.standard.removePersistentDomain(forName: suiteName) }

        let store1 = AuthStore(userDefaults: defaults)
        store1.login(user: makeUser(), role: .merchant)

        let store2 = AuthStore(userDefaults: defaults)
        #expect(store2.currentUser?.id == "u1")
        #expect(store2.role == .merchant)
    }

    // T2.2.11: logout clears UserDefaults keys
    @Test func logoutClearsUserDefaults() {
        let suiteName = "test-logout-clear-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suiteName)!
        defer { UserDefaults.standard.removePersistentDomain(forName: suiteName) }

        let store = AuthStore(userDefaults: defaults)
        store.login(user: makeUser(), role: .customer)
        store.logout()

        #expect(defaults.data(forKey: "terra_auth_user") == nil)
        #expect(defaults.string(forKey: "terra_auth_role") == nil)
    }
}
