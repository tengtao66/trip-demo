import SwiftUI

struct BookingListView: View {
    @Environment(AuthStore.self) private var authStore
    @State private var bookingStore = BookingStore()

    var body: some View {
        ScrollView {
            if bookingStore.isLoading && bookingStore.bookings.isEmpty {
                ForEach(0..<3, id: \.self) { _ in
                    BookingCardView.placeholder
                }
                .padding(.horizontal, TerraSpacing.screenEdge)
            } else if let error = bookingStore.error {
                EmptyStateView(
                    icon: "wifi.exclamationmark",
                    title: "Something went wrong",
                    subtitle: error.localizedDescription,
                    actionLabel: "Try Again"
                ) {
                    Task { await bookingStore.loadBookings() }
                }
            } else if bookingStore.bookings.isEmpty {
                EmptyStateView(
                    icon: "calendar",
                    title: "No bookings yet",
                    subtitle: "Book a trip to get started",
                    actionLabel: "Explore Trips"
                ) {
                    authStore.selectedTab = .home
                }
            } else {
                LazyVStack(spacing: TerraSpacing.sm) {
                    ForEach(bookingStore.bookings) { booking in
                        NavigationLink(value: NavigationDestination.bookingDetail(id: booking.id)) {
                            BookingCardView(booking: booking)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)
                .padding(.bottom, TerraSpacing.xxl)
            }
        }
        .background(Color.terraAlpineOat)
        .navigationTitle("Bookings")
        .refreshable {
            await bookingStore.refresh()
        }
        .task {
            if bookingStore.bookings.isEmpty {
                await bookingStore.loadBookings()
            }
        }
    }
}

extension BookingCardView {
    static var placeholder: some View {
        TerraCard {
            HStack(spacing: TerraSpacing.sm) {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color.terraBorder)
                    .frame(width: 56, height: 56)
                VStack(alignment: .leading, spacing: 4) {
                    RoundedRectangle(cornerRadius: 4).fill(Color.terraBorder).frame(width: 120, height: 14)
                    RoundedRectangle(cornerRadius: 4).fill(Color.terraBorder).frame(width: 80, height: 10)
                }
                Spacer()
            }
        }
        .redacted(reason: .placeholder)
    }
}
