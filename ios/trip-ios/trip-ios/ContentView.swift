import SwiftUI

struct ContentView: View {
    @Environment(AuthStore.self) private var authStore
    @Environment(TripStore.self) private var tripStore
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass

    var body: some View {
        if horizontalSizeClass == .regular {
            iPadLayout
        } else {
            iPhoneLayout
        }
    }

    // MARK: - iPhone (TabView)

    private var iPhoneLayout: some View {
        @Bindable var authStore = authStore

        return TabView(selection: $authStore.selectedTab) {
            ForEach(TerraTab.allCases, id: \.self) { tab in
                tabContent(for: tab)
                    .tabItem {
                        Label(tab.label, systemImage: tab.sfSymbol)
                    }
                    .tag(tab)
            }
        }
        .tint(Color.terraTerracotta)
    }

    // MARK: - iPad (NavigationSplitView)

    private var iPadLayout: some View {
        @Bindable var authStore = authStore

        return NavigationSplitView {
            List(TerraTab.allCases, id: \.self, selection: Binding<TerraTab?>(
                get: { authStore.selectedTab },
                set: { if let tab = $0 { authStore.selectedTab = tab } }
            )) { tab in
                Label(tab.label, systemImage: tab.sfSymbol)
            }
            .navigationTitle("TERRA")
            .listStyle(.sidebar)
        } detail: {
            tabContent(for: authStore.selectedTab)
        }
        .tint(Color.terraTerracotta)
    }

    // MARK: - Tab Content

    @ViewBuilder
    private func tabContent(for tab: TerraTab) -> some View {
        @Bindable var authStore = authStore
        let pathBinding = Binding<[NavigationDestination]>(
            get: { authStore.navigationPaths[tab] ?? [] },
            set: { authStore.navigationPaths[tab] = $0 }
        )

        NavigationStack(path: pathBinding) {
            Group {
                switch tab {
                case .home:
                    ExploreTabView()
                case .search:
                    SearchView()
                case .bookings:
                    if authStore.role == .merchant {
                        MerchantHomeView()
                    } else {
                        BookingListView()
                    }
                case .profile:
                    ProfileView()
                        .navigationTitle("Profile")
                }
            }
            .navigationDestination(for: NavigationDestination.self) { dest in
                switch dest {
                case .tripDetail(let slug):
                    if let trip = tripStore.trips.first(where: { $0.slug == slug }) {
                        TripDetailView(trip: trip)
                    } else {
                        TripDetailPlaceholder(slug: slug)
                    }
                case .checkout(let slug, let pickupDate, let dropoffDate):
                    if let trip = tripStore.trips.first(where: { $0.slug == slug }) {
                        CheckoutRouter(trip: trip, pickupDate: pickupDate, dropoffDate: dropoffDate)
                    } else {
                        Text("Trip not found")
                    }
                case .bookingDetail(let id):
                    BookingDetailView(bookingId: id)
                case .merchantBookingDetail(let id):
                    MerchantBookingDetailView(bookingId: id)
                case .captureBalance(let bookingId):
                    MerchantBookingDetailView(bookingId: bookingId)
                }
            }
        }
    }

    // MARK: - Placeholder

    private func placeholderView(title: String, icon: String) -> some View {
        VStack(spacing: TerraSpacing.md) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundStyle(Color.terraTerracotta.opacity(0.4))
                .accessibilityHidden(true)
            Text(title)
                .font(.terraTitle)
                .foregroundStyle(Color.terraTextMuted)
            Text("Coming soon")
                .font(.terraCaption)
                .foregroundStyle(Color.terraTextMuted.opacity(0.6))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.terraAlpineOat)
        .navigationTitle(title)
    }
}

// MARK: - Trip Detail Loader

struct TripDetailPlaceholder: View {
    let slug: String
    @State private var trip: Trip?
    @State private var isLoading = true

    var body: some View {
        Group {
            if let trip {
                TripDetailView(trip: trip)
            } else if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.terraAlpineOat)
            } else {
                Text("Trip not found")
                    .foregroundStyle(Color.terraTextMuted)
            }
        }
        .task {
            do {
                trip = try await TripService().fetchTrip(slug: slug)
            } catch {
                // Trip not found or network error
            }
            isLoading = false
        }
    }
}

#Preview("Logged Out") {
    ContentView()
        .environment(AuthStore())
}

#Preview("Logged In") {
    let store = AuthStore()
    store.login(user: User(id: "u1", name: "John Doe", email: "john@test.com"), role: .customer)
    return ContentView()
        .environment(store)
}
