import SwiftUI

struct BookingDetailView: View {
    let bookingId: String
    @State private var detail: BookingDetail?
    @State private var isLoading = true
    @State private var error: APIError?

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView()
                    .frame(maxWidth: .infinity, minHeight: 200)
            } else if let error {
                EmptyStateView(icon: "exclamationmark.triangle", title: "Error", subtitle: error.localizedDescription, actionLabel: "Retry") {
                    Task { await load() }
                }
            } else if let detail {
                detailContent(detail)
            }
        }
        .background(Color.terraAlpineOat)
        .navigationTitle(detail?.bookingReference ?? "Booking")
        .task { await load() }
    }

    private func load() async {
        isLoading = true
        error = nil
        do {
            detail = try await BookingService().fetchBooking(id: bookingId)
        } catch let apiError as APIError {
            error = apiError
        } catch {
            self.error = .networkError(error.localizedDescription)
        }
        isLoading = false
    }

    private func detailContent(_ detail: BookingDetail) -> some View {
        VStack(alignment: .leading, spacing: TerraSpacing.md) {
            // Header
            HStack {
                Text(detail.bookingReference)
                    .font(.terraTitle)
                    .foregroundStyle(Color.terraMocha)
                Spacer()
                StatusBadge(status: detail.status)
            }
            .padding(.horizontal, TerraSpacing.screenEdge)

            // Trip info card
            TerraCard {
                HStack(spacing: TerraSpacing.sm) {
                    RoundedRectangle(cornerRadius: 10)
                        .fill(Color.terraTerracotta.opacity(0.3))
                        .frame(width: 56, height: 48)
                    VStack(alignment: .leading, spacing: 2) {
                        Text(detail.tripName ?? "Trip")
                            .font(.terraHeadline)
                            .foregroundStyle(Color.terraText)
                        if let days = detail.durationDays {
                            Text("\(days) Days")
                                .font(.terraCaption)
                                .foregroundStyle(Color.terraTextMuted)
                        }
                    }
                    Spacer()
                }
            }
            .padding(.horizontal, TerraSpacing.screenEdge)

            // Payment Timeline
            SectionHeader(title: "Payment Timeline")
                .padding(.horizontal, TerraSpacing.screenEdge)
            TerraCard {
                PaymentTimeline(steps: timelineSteps(for: detail))
            }
            .padding(.horizontal, TerraSpacing.screenEdge)

            // Progress bar
            if detail.totalAmount > 0 {
                progressSection(detail)
                    .padding(.horizontal, TerraSpacing.screenEdge)
            }

            // Authorization countdown (Flow 1)
            if detail.paymentFlow == "authorize", let expiresStr = detail.authorizationExpiresAt, let expiresDate = expiresStr.asDate {
                let remaining = BookingCalculator.daysRemaining(expiresAt: expiresDate)
                countdownView(remaining: remaining)
                    .padding(.horizontal, TerraSpacing.screenEdge)
            }

            // PayPal details
            SectionHeader(title: "PayPal Order")
                .padding(.horizontal, TerraSpacing.screenEdge)
            TerraCard {
                VStack(spacing: 0) {
                    if let orderId = detail.paypalOrderId {
                        InfoRow(label: "Order ID", value: orderId)
                    }
                    if let captureId = detail.charges.first(where: { $0.status == "completed" })?.paypalCaptureId {
                        InfoRow(label: "Capture ID", value: captureId)
                    }
                    InfoRow(label: "Status", value: detail.status)
                }
            }
            .padding(.horizontal, TerraSpacing.screenEdge)
            .padding(.bottom, TerraSpacing.xxl)
        }
        .padding(.top, TerraSpacing.md)
    }

    private func timelineSteps(for detail: BookingDetail) -> [TimelineStep] {
        switch detail.paymentFlow {
        case "authorize": PaymentTimeline.forAuthorize(booking: detail)
        case "vault": PaymentTimeline.forVault(booking: detail)
        case "invoice": PaymentTimeline.forInvoice(booking: detail)
        default: PaymentTimeline.forInstant(booking: detail)
        }
    }

    private func progressSection(_ detail: BookingDetail) -> some View {
        let ratio = BookingCalculator.progressRatio(paid: detail.paidAmount, total: detail.totalAmount)
        return VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("Payment Progress").font(.system(size: 12, weight: .semibold))
                Spacer()
                Text("\(detail.paidAmount.asCurrency) / \(detail.totalAmount.asCurrency)")
                    .font(.terraCaption).foregroundStyle(Color.terraTextMuted)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 3).fill(Color.terraBorder).frame(height: 6)
                    RoundedRectangle(cornerRadius: 3).fill(Color.terraSage).frame(width: geo.size.width * ratio, height: 6)
                }
            }
            .frame(height: 6)
            Text("\(Int(ratio * 100))% paid")
                .font(.terraFootnote).foregroundStyle(Color.terraTextMuted)
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
    }

    private func countdownView(remaining: Int) -> some View {
        HStack(spacing: TerraSpacing.xs) {
            Image(systemName: "timer")
                .foregroundStyle(Color.terraWarningText)
                .accessibilityHidden(true)
            Text(remaining > 0 ? "\(remaining) days remaining on authorization" : "Authorization expired")
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(Color.terraWarningText)
        }
        .padding(TerraSpacing.sm)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.terraWarning.opacity(0.12))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}
