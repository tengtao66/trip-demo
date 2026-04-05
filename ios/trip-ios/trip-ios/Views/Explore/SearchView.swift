import SwiftUI

struct SearchView: View {
    @Environment(TripStore.self) private var tripStore
    @State private var searchText = ""
    @State private var selectedCategory: TripCategory?

    private var filteredTrips: [Trip] {
        var result = tripStore.trips
        if let category = selectedCategory {
            result = result.filter { $0.category == category }
        }
        if !searchText.isEmpty {
            result = result.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
        }
        return result
    }

    var body: some View {
        VStack(spacing: 0) {
            // Category filter chips
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: TerraSpacing.xs) {
                    filterChip(label: "All", isSelected: selectedCategory == nil) {
                        selectedCategory = nil
                    }
                    ForEach(TripCategory.allCases, id: \.self) { category in
                        filterChip(label: categoryLabel(category), isSelected: selectedCategory == category) {
                            selectedCategory = category
                        }
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)
                .padding(.vertical, TerraSpacing.xs)
            }

            // Results
            ScrollView {
                if filteredTrips.isEmpty && !searchText.isEmpty {
                    VStack(spacing: TerraSpacing.sm) {
                        Spacer(minLength: 60)
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 36))
                            .foregroundStyle(Color.terraTextMuted.opacity(0.4))
                            .accessibilityHidden(true)
                        Text("No trips match \"\(searchText)\"")
                            .font(.terraBody)
                            .foregroundStyle(Color.terraTextMuted)
                        Spacer()
                    }
                    .frame(maxWidth: .infinity)
                } else {
                    LazyVStack(spacing: TerraSpacing.md) {
                        ForEach(filteredTrips) { trip in
                            NavigationLink(value: NavigationDestination.tripDetail(slug: trip.slug)) {
                                TripCardView(trip: trip)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, TerraSpacing.screenEdge)
                    .padding(.bottom, TerraSpacing.xxl)
                }
            }
        }
        .background(Color.terraAlpineOat)
        .navigationTitle("Search")
        .searchable(text: $searchText, prompt: "Search trips...")
        .refreshable { await tripStore.refresh() }
        .task {
            if tripStore.trips.isEmpty {
                await tripStore.loadTrips()
            }
        }
    }

    private func filterChip(label: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 13, weight: isSelected ? .semibold : .regular))
                .foregroundStyle(isSelected ? .white : Color.terraText)
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(isSelected ? Color.terraTerracotta : Color.terraIvory)
                .clipShape(Capsule())
                .overlay(Capsule().stroke(isSelected ? Color.clear : Color.terraBorder, lineWidth: 1))
        }
    }

    private func categoryLabel(_ category: TripCategory) -> String {
        switch category {
        case .tour: "Tours"
        case .carRental: "Cars"
        case .cruise: "Cruises"
        }
    }
}

#Preview {
    NavigationStack {
        SearchView()
    }
}
