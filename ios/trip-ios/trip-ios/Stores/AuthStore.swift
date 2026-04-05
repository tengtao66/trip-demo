import SwiftUI
import Observation

enum TerraTab: String, CaseIterable, Hashable, Sendable {
    case home
    case search
    case bookings
    case profile

    var sfSymbol: String {
        switch self {
        case .home: "house"
        case .search: "magnifyingglass"
        case .bookings: "calendar"
        case .profile: "person.circle"
        }
    }

    var label: String {
        switch self {
        case .home: "Home"
        case .search: "Search"
        case .bookings: "Bookings"
        case .profile: "Profile"
        }
    }
}

enum NavigationDestination: Hashable, Sendable {
    case tripDetail(slug: String)
    case checkout(slug: String, pickupDate: Date? = nil, dropoffDate: Date? = nil)
    case bookingDetail(id: String)
    case merchantBookingDetail(id: String)
    case captureBalance(bookingId: String)
}

@Observable
final class AuthStore {
    var currentUser: User?
    var role: UserRole = .customer
    var selectedTab: TerraTab = .home
    var navigationPaths: [TerraTab: [NavigationDestination]] = [
        .home: [],
        .search: [],
        .bookings: [],
        .profile: []
    ]

    var isLoggedIn: Bool {
        currentUser != nil
    }

    private let userDefaults: UserDefaults

    init(userDefaults: UserDefaults = .standard) {
        self.userDefaults = userDefaults
        restoreState()
    }

    func login(user: User, role: UserRole) {
        self.currentUser = user
        self.role = role
        self.selectedTab = .home
        persistState()
    }

    func logout() {
        currentUser = nil
        role = .customer
        selectedTab = .home
        resetNavigationPaths()
        userDefaults.removeObject(forKey: "terra_auth_user")
        userDefaults.removeObject(forKey: "terra_auth_role")
    }

    func switchRole(_ newRole: UserRole) {
        role = newRole
        selectedTab = .home
        resetNavigationPaths()
        persistState()
    }

    private func resetNavigationPaths() {
        for tab in TerraTab.allCases {
            navigationPaths[tab] = []
        }
    }

    private func persistState() {
        if let user = currentUser,
           let data = try? JSONEncoder().encode(user) {
            userDefaults.set(data, forKey: "terra_auth_user")
        }
        userDefaults.set(role.rawValue, forKey: "terra_auth_role")
    }

    private func restoreState() {
        if let data = userDefaults.data(forKey: "terra_auth_user"),
           let user = try? JSONDecoder().decode(User.self, from: data) {
            currentUser = user
        }
        if let roleStr = userDefaults.string(forKey: "terra_auth_role"),
           let savedRole = UserRole(rawValue: roleStr) {
            role = savedRole
        }
    }
}
