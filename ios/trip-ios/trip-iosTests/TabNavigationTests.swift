import Testing
import Foundation
@testable import trip_ios

// MARK: - T2.3 Tab & NavigationDestination Tests

@Suite("Tab & Navigation")
@MainActor
struct TabNavigationTests {

    // T2.3.1: TerraTab.allCases returns exactly 4 tabs
    @Test func allCasesReturnsFourTabs() {
        #expect(TerraTab.allCases.count == 4)
        #expect(TerraTab.allCases == [.home, .search, .bookings, .profile])
    }

    // T2.3.2: TerraTab.home.sfSymbol equals "house"
    @Test func tabSFSymbols() {
        #expect(TerraTab.home.sfSymbol == "house")
        #expect(TerraTab.search.sfSymbol == "magnifyingglass")
        #expect(TerraTab.bookings.sfSymbol == "calendar")
        #expect(TerraTab.profile.sfSymbol == "person.circle")
    }

    // T2.3.3: Tab labels are correct
    @Test func tabLabels() {
        #expect(TerraTab.home.label == "Home")
        #expect(TerraTab.search.label == "Search")
        #expect(TerraTab.bookings.label == "Bookings")
        #expect(TerraTab.profile.label == "Profile")
    }

    // T2.3.4: NavigationDestination with same slug are equal
    @Test func navigationDestinationEquality() {
        let a = NavigationDestination.tripDetail(slug: "tokyo")
        let b = NavigationDestination.tripDetail(slug: "tokyo")
        #expect(a == b)
    }

    // T2.3.5: NavigationDestination with different slugs are not equal
    @Test func navigationDestinationInequality() {
        let a = NavigationDestination.tripDetail(slug: "tokyo")
        let b = NavigationDestination.tripDetail(slug: "bali")
        #expect(a != b)
    }

    // T2.3.6: Different NavigationDestination cases are not equal
    @Test func navigationDestinationDifferentCases() {
        let a = NavigationDestination.tripDetail(slug: "tokyo")
        let b = NavigationDestination.checkout(slug: "tokyo")
        #expect(a != b)
    }

    // Navigation path binding: role switch clears paths that had items
    @Test func roleSwitchClearsPopulatedPaths() {
        let suiteName = "test-tab-nav-\(UUID().uuidString)"
        let store = AuthStore(userDefaults: UserDefaults(suiteName: suiteName)!)
        defer { UserDefaults.standard.removePersistentDomain(forName: suiteName) }

        store.login(user: User(id: "u1", name: "Test", email: "t@t.com"), role: .customer)
        store.navigationPaths[.home] = [.tripDetail(slug: "tokyo"), .checkout(slug: "tokyo")]
        store.navigationPaths[.bookings] = [.bookingDetail(id: "b1")]

        store.switchRole(.merchant)

        #expect(store.navigationPaths[.home]?.isEmpty == true)
        #expect(store.navigationPaths[.bookings]?.isEmpty == true)
        #expect(store.navigationPaths[.search]?.isEmpty == true)
        #expect(store.navigationPaths[.profile]?.isEmpty == true)
    }
}
