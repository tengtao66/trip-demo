import SwiftUI

struct MerchantBookingDetailView: View {
    let bookingId: String
    @State private var detail: BookingDetail?
    @State private var isLoading = true
    @State private var error: APIError?
    @State private var actionInProgress = false
    @State private var showCaptureConfirm = false
    @State private var showVoidConfirm = false

    var body: some View {
        ScrollView {
            if isLoading {
                ProgressView().frame(maxWidth: .infinity, minHeight: 200)
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
            // Merchant badge
            StatusBadge(status: "merchant")
                .padding(.horizontal, TerraSpacing.screenEdge)

            // Customer card
            TerraCard {
                HStack(spacing: TerraSpacing.sm) {
                    Text(customerInitials(detail))
                        .font(.terraHeadline).foregroundStyle(.white)
                        .frame(width: 36, height: 36)
                        .background(Color.terraMocha)
                        .clipShape(Circle())
                    VStack(alignment: .leading, spacing: 2) {
                        Text(detail.customerName ?? "Customer").font(.terraHeadline).foregroundStyle(Color.terraText)
                        Text(detail.customerEmail ?? "").font(.terraCaption).foregroundStyle(Color.terraTextMuted)
                    }
                    Spacer()
                }
            }
            .padding(.horizontal, TerraSpacing.screenEdge)

            // Trip info
            TerraCard {
                VStack(spacing: 0) {
                    InfoRow(label: "Trip", value: detail.tripName ?? "")
                    InfoRow(label: "Flow", value: detail.paymentFlow.capitalized)
                    if let days = detail.durationDays {
                        InfoRow(label: "Duration", value: "\(days) Days")
                    }
                    InfoRow(label: "Ref", value: detail.bookingReference)
                }
            }
            .padding(.horizontal, TerraSpacing.screenEdge)

            // Payment
            SectionHeader(title: "Payment")
                .padding(.horizontal, TerraSpacing.screenEdge)
            TerraCard {
                VStack(spacing: 0) {
                    InfoRow(label: "Status", value: detail.status)
                    if let orderId = detail.paypalOrderId {
                        InfoRow(label: "PayPal Order", value: orderId)
                    }
                    InfoRow(label: "Total", value: detail.totalAmount.asCurrency)
                    InfoRow(label: "Paid", value: detail.paidAmount.asCurrency)
                }
            }
            .padding(.horizontal, TerraSpacing.screenEdge)

            // Progress
            if detail.totalAmount > 0 {
                let ratio = BookingCalculator.progressRatio(paid: detail.paidAmount, total: detail.totalAmount)
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text("Collected").font(.system(size: 11, weight: .semibold))
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
                }
                .padding(.horizontal, TerraSpacing.screenEdge)
            }

            // Action buttons (flow-specific)
            actionButtons(detail)
                .padding(.horizontal, TerraSpacing.screenEdge)
                .padding(.bottom, TerraSpacing.xxl)
        }
        .padding(.top, TerraSpacing.md)
    }

    @ViewBuilder
    private func actionButtons(_ detail: BookingDetail) -> some View {
        switch detail.paymentFlow {
        case "authorize":
            if detail.paidAmount < detail.totalAmount {
                TerraButton(label: "Capture Balance (\(BookingCalculator.captureAmount(total: detail.totalAmount, deposit: detail.paidAmount).asCurrency))", icon: "banknote", isLoading: actionInProgress) {
                    showCaptureConfirm = true
                }
                .confirmationDialog("Capture Balance?", isPresented: $showCaptureConfirm) {
                    Button("Capture \(BookingCalculator.captureAmount(total: detail.totalAmount, deposit: detail.paidAmount).asCurrency)") {
                        Task { await captureBalance(authorizationId: detail.authorizationId ?? "") }
                    }
                    Button("Cancel", role: .cancel) {}
                }
                TerraButton(label: "Void Authorization", icon: "xmark.circle", style: .destructive, isLoading: actionInProgress) {
                    showVoidConfirm = true
                }
                .confirmationDialog("Void Authorization?", isPresented: $showVoidConfirm) {
                    Button("Void", role: .destructive) {
                        Task { await voidAuth(authorizationId: detail.authorizationId ?? "") }
                    }
                    Button("Cancel", role: .cancel) {}
                }
            }
        case "instant":
            TerraButton(label: "Issue Refund", icon: "arrow.counterclockwise", style: .destructive) {
                // Refund flow — to be implemented
            }
        default:
            EmptyView()
        }
    }

    private func captureBalance(authorizationId: String) async {
        actionInProgress = true
        do {
            _ = try await MerchantService().captureBalance(authorizationId: authorizationId)
            HapticFeedback.success()
            await load()
        } catch let apiError as APIError {
            self.error = apiError
            HapticFeedback.error()
        } catch {
            self.error = .networkError(error.localizedDescription)
            HapticFeedback.error()
        }
        actionInProgress = false
    }

    private func voidAuth(authorizationId: String) async {
        actionInProgress = true
        do {
            _ = try await MerchantService().voidAuth(authorizationId: authorizationId)
            HapticFeedback.success()
            await load()
        } catch let apiError as APIError {
            self.error = apiError
            HapticFeedback.error()
        } catch {
            self.error = .networkError(error.localizedDescription)
            HapticFeedback.error()
        }
        actionInProgress = false
    }

    private func customerInitials(_ detail: BookingDetail) -> String {
        let parts = (detail.customerName ?? "").split(separator: " ")
        if parts.count >= 2 {
            return "\(parts[0].prefix(1))\(parts[1].prefix(1))".uppercased()
        }
        return String((detail.customerName ?? "C").prefix(1)).uppercased()
    }
}
