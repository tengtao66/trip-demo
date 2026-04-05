import SwiftUI

struct ExploreTabView: View {
    @Environment(TripStore.self) private var tripStore

    var body: some View {
        @Bindable var tripStore = tripStore
        VStack(spacing: 0) {
            // Category segmented control
            Picker("Category", selection: $tripStore.selectedCategory) {
                Text("Tours").tag(TripCategory.tour)
                Text("Car Rentals").tag(TripCategory.carRental)
                Text("Cruises").tag(TripCategory.cruise)
            }
            .pickerStyle(.segmented)
            .padding(.horizontal, TerraSpacing.screenEdge)
            .padding(.vertical, TerraSpacing.sm)

            if let error = tripStore.error {
                errorView(error: error)
            } else {
                TripListView(trips: tripStore.filteredTrips, isLoading: tripStore.isLoading)
            }
        }
        .background(Color.terraAlpineOat)
        .navigationTitle("Explore")
        .refreshable {
            await tripStore.refresh()
        }
        .task {
            if tripStore.trips.isEmpty {
                await tripStore.loadTrips()
            }
        }
    }

    private func errorView(error: APIError) -> some View {
        VStack(spacing: TerraSpacing.sm) {
            Spacer(minLength: 60)
            Image(systemName: "wifi.exclamationmark")
                .font(.system(size: 36))
                .foregroundStyle(Color.terraDestructive.opacity(0.5))
                .accessibilityHidden(true)
            Text("Something went wrong")
                .font(.terraTitle)
                .foregroundStyle(Color.terraText)
            Text(error.localizedDescription)
                .font(.terraCaption)
                .foregroundStyle(Color.terraTextMuted)
                .multilineTextAlignment(.center)
            TerraButton(label: "Try Again", style: .outline) {
                Task { await tripStore.loadTrips() }
            }
            .padding(.horizontal, TerraSpacing.xxxl)
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
}

#Preview {
    NavigationStack {
        ExploreTabView()
            .environment(TripStore())
    }
}
