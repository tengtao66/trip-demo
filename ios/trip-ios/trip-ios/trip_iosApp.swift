import SwiftUI

@main
struct trip_iosApp: App {
    @State private var authStore = AuthStore()
    @State private var tripStore = TripStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(authStore)
                .environment(tripStore)
        }
    }
}
