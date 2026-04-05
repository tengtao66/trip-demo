import SwiftUI
import UIKit

struct BookingCardView: View {
    let booking: Booking

    var body: some View {
        TerraCard {
            HStack(spacing: TerraSpacing.sm) {
                // Trip image thumbnail
                ZStack {
                    LinearGradient(
                        colors: gradientColors,
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    if let slug = booking.tripSlug, UIImage(named: "trip-\(slug)") != nil {
                        Image("trip-\(slug)")
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    }
                }
                .frame(width: 56, height: 56)
                .clipShape(RoundedRectangle(cornerRadius: 10))

                VStack(alignment: .leading, spacing: 4) {
                    Text(booking.tripName ?? "Trip")
                        .font(.terraHeadline)
                        .foregroundStyle(Color.terraText)
                    Text(booking.bookingReference)
                        .font(.terraCaption)
                        .foregroundStyle(Color.terraTextMuted)
                    Text(booking.createdAt.asDate?.formatted_MMMddyyyy ?? booking.createdAt)
                        .font(.terraFootnote)
                        .foregroundStyle(Color.terraTextMuted)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    StatusBadge(status: booking.status)
                    Text(booking.totalAmount.asCurrency)
                        .font(.terraHeadline)
                        .foregroundStyle(Color.terraMocha)
                }
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(booking.tripName ?? "Trip"), \(booking.bookingReference), \(booking.status), \(booking.totalAmount.asCurrency)")
    }

    private var gradientColors: [Color] {
        // Parse from booking.imageGradient if available
        if let gradient = booking.imageGradient {
            let pattern = /#[0-9A-Fa-f]{6}/
            let matches = gradient.matches(of: pattern)
            let colors = matches.map { Color(hex: String(gradient[$0.range])) }
            if colors.count >= 2 { return colors }
        }
        return [Color.terraTerracotta.opacity(0.6), Color.terraMocha]
    }
}
