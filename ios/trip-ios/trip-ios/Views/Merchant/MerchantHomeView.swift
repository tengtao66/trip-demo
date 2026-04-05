import SwiftUI

struct MerchantHomeView: View {
    @State private var stats: MerchantStats?
    @State private var allBookings: [Booking] = []
    @State private var isLoading = true
    @State private var selectedFlowFilter: String? = nil
    @State private var error: APIError?

    var filteredBookings: [Booking] {
        guard let filter = selectedFlowFilter else { return allBookings }
        return allBookings.filter { $0.paymentFlow == filter }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TerraSpacing.md) {
                // KPI Cards
                if let stats {
                    kpiGrid(stats)
                        .padding(.horizontal, TerraSpacing.screenEdge)
                }

                // Filter chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: TerraSpacing.xs) {
                        filterChip("All", isSelected: selectedFlowFilter == nil) { selectedFlowFilter = nil }
                        filterChip("Authorize", isSelected: selectedFlowFilter == "authorize") { selectedFlowFilter = "authorize" }
                        filterChip("Vault", isSelected: selectedFlowFilter == "vault") { selectedFlowFilter = "vault" }
                        filterChip("Invoice", isSelected: selectedFlowFilter == "invoice") { selectedFlowFilter = "invoice" }
                        filterChip("Instant", isSelected: selectedFlowFilter == "instant") { selectedFlowFilter = "instant" }
                    }
                    .padding(.horizontal, TerraSpacing.screenEdge)
                }

                // Error
                if let error {
                    EmptyStateView(icon: "wifi.exclamationmark", title: "Error", subtitle: error.localizedDescription, actionLabel: "Retry") {
                        Task { await load() }
                    }
                }

                // Bookings list
                if filteredBookings.isEmpty && !isLoading {
                    EmptyStateView(icon: "tray", title: "No bookings", subtitle: "No bookings match this filter")
                } else {
                    LazyVStack(spacing: TerraSpacing.sm) {
                        ForEach(filteredBookings) { booking in
                            NavigationLink(value: NavigationDestination.merchantBookingDetail(id: booking.id)) {
                                merchantBookingRow(booking)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, TerraSpacing.screenEdge)
                }
            }
            .padding(.top, TerraSpacing.md)
            .padding(.bottom, TerraSpacing.xxl)
        }
        .background(Color.terraAlpineOat)
        .navigationTitle("Merchant")
        .refreshable { await load() }
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        error = nil
        do {
            let service = MerchantService()
            async let s = service.fetchStats()
            async let b = service.fetchAllBookings()
            stats = try await s
            allBookings = try await b
        } catch let apiError as APIError {
            error = apiError
        } catch {
            self.error = .networkError(error.localizedDescription)
        }
        isLoading = false
    }

    // MARK: - KPI Grid

    private func kpiGrid(_ stats: MerchantStats) -> some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: TerraSpacing.sm) {
            kpiCard(icon: "calendar.badge.clock", label: "Active Bookings", value: "\(stats.activeBookings)")
            kpiCard(icon: "creditcard.circle", label: "Pending Captures", value: "\(stats.pendingCaptures)")
            kpiCard(icon: "doc.text", label: "Open Invoices", value: "\(stats.openInvoices)")
            kpiCard(icon: "dollarsign.circle", label: "Monthly Revenue", value: stats.monthlyRevenue.asCurrency)
        }
    }

    private func kpiCard(icon: String, label: String, value: String) -> some View {
        TerraCard {
            VStack(spacing: TerraSpacing.xs) {
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundStyle(Color.terraTerracotta)
                    .accessibilityHidden(true)
                Text(value)
                    .font(.terraTitle)
                    .foregroundStyle(Color.terraMocha)
                Text(label)
                    .font(.terraCaption)
                    .foregroundStyle(Color.terraTextMuted)
            }
            .frame(maxWidth: .infinity)
        }
    }

    // MARK: - Booking Row

    private func merchantBookingRow(_ booking: Booking) -> some View {
        TerraCard {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(booking.customerName ?? "Customer")
                        .font(.terraHeadline).foregroundStyle(Color.terraText)
                    Text("\(booking.tripName ?? "Trip") · \(booking.bookingReference)")
                        .font(.terraCaption).foregroundStyle(Color.terraTextMuted)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 4) {
                    StatusBadge(status: booking.status)
                    Text(booking.totalAmount.asCurrency)
                        .font(.terraHeadline).foregroundStyle(Color.terraMocha)
                }
            }
        }
    }

    // MARK: - Filter Chip

    private func filterChip(_ label: String, isSelected: Bool, action: @escaping () -> Void) -> some View {
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
}
