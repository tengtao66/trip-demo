import SwiftUI

struct TripCardView: View {
    let trip: Trip

    var body: some View {
        TerraCard {
            VStack(alignment: .leading, spacing: 0) {
                // Image area with gradient
                ZStack(alignment: .topLeading) {
                    // Trip image with gradient fallback
                    ZStack {
                        gradientBackground
                        if trip.hasImage {
                            Image(trip.imageName)
                                .resizable()
                                .aspectRatio(contentMode: .fill)
                        }
                    }
                    .frame(height: 140)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay(alignment: .bottom) {
                        LinearGradient(colors: [.clear, .black.opacity(0.5)], startPoint: .center, endPoint: .bottom)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                    .overlay(alignment: .bottomLeading) {
                        Text(trip.name)
                            .font(.terraHeadline)
                            .foregroundStyle(.white)
                            .padding(TerraSpacing.sm)
                    }

                    // Payment flow badge (top-left)
                    Text(trip.flowBadgeLabel)
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(Color.terraMocha)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(.white.opacity(0.9))
                        .clipShape(Capsule())
                        .padding(TerraSpacing.xs)

                    // Duration badge (top-right)
                    HStack(spacing: 3) {
                        Image(systemName: "clock")
                            .font(.system(size: 9))
                        Text(trip.durationLabel)
                            .font(.system(size: 10, weight: .semibold))
                    }
                    .foregroundStyle(Color.terraMocha)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(.white.opacity(0.9))
                    .clipShape(Capsule())
                    .frame(maxWidth: .infinity, alignment: .trailing)
                    .padding(TerraSpacing.xs)
                }

                // Price row
                HStack {
                    Text(trip.priceLabel)
                        .font(.terraHeadline)
                        .foregroundStyle(Color.terraMocha)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12))
                        .foregroundStyle(Color.terraTextMuted)
                }
                .padding(.top, TerraSpacing.sm)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(trip.name), \(trip.priceLabel), \(trip.durationLabel), \(trip.flowBadgeLabel)")
    }

    // MARK: - Computed Properties

    private var gradientBackground: some View {
        LinearGradient(colors: trip.gradientColors, startPoint: .topLeading, endPoint: .bottomTrailing)
    }

    // MARK: - Skeleton Placeholder

    static var placeholder: some View {
        TerraCard {
            VStack(alignment: .leading, spacing: 0) {
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.terraBorder)
                    .frame(height: 140)
                HStack {
                    RoundedRectangle(cornerRadius: 4)
                        .fill(Color.terraBorder)
                        .frame(width: 80, height: 16)
                    Spacer()
                }
                .padding(.top, TerraSpacing.sm)
            }
        }
        .redacted(reason: .placeholder)
    }
}
