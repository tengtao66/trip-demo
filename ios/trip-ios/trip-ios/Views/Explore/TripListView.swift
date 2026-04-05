import SwiftUI

struct TripListView: View {
    let trips: [Trip]
    let isLoading: Bool

    @Environment(\.horizontalSizeClass) private var sizeClass

    private var columns: [GridItem] {
        if sizeClass == .regular {
            [GridItem(.flexible()), GridItem(.flexible())]
        } else {
            [GridItem(.flexible())]
        }
    }

    var body: some View {
        ScrollView {
            if isLoading && trips.isEmpty {
                LazyVGrid(columns: columns, spacing: TerraSpacing.md) {
                    ForEach(0..<3, id: \.self) { _ in
                        TripCardView.placeholder
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)
            } else if trips.isEmpty {
                emptyState
            } else {
                LazyVGrid(columns: columns, spacing: TerraSpacing.md) {
                    ForEach(Array(trips.enumerated()), id: \.element.id) { index, trip in
                        NavigationLink(value: NavigationDestination.tripDetail(slug: trip.slug)) {
                            TripCardView(trip: trip)
                        }
                        .buttonStyle(.plain)
                        .staggeredAppearance(index: index)
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)
                .padding(.bottom, TerraSpacing.xxl)
            }
        }
    }

    private var emptyState: some View {
        VStack(spacing: TerraSpacing.md) {
            Spacer(minLength: 80)
            Image(systemName: "map")
                .font(.system(size: 48))
                .foregroundStyle(Color.terraTerracotta.opacity(0.3))
                .accessibilityHidden(true)
            Text("No trips available")
                .font(.terraTitle)
                .foregroundStyle(Color.terraTextMuted)
            Text("Check back later for new destinations")
                .font(.terraCaption)
                .foregroundStyle(Color.terraTextMuted.opacity(0.7))
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
}
