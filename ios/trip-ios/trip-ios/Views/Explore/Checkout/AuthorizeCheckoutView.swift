import SwiftUI
import PayPalMessages

struct AuthorizeCheckoutView: View {
    let trip: Trip
    let onComplete: (BookingResult) -> Void
    @State private var isLoading = false
    @State private var error: APIError?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TerraSpacing.md) {
                // Order summary
                orderSummary
                    .padding(.horizontal, TerraSpacing.screenEdge)

                // Package breakdown
                SectionHeader(title: "Package Breakdown")
                    .padding(.horizontal, TerraSpacing.screenEdge)
                TerraCard {
                    VStack(spacing: 6) {
                        ForEach(trip.feeBreakdown, id: \.item) { item, amount in
                            feeRow(label: item, value: amount.asCurrency, bold: false)
                        }
                        Divider().padding(.vertical, 4)
                        feeRow(label: "Total", value: trip.basePrice.asCurrency, bold: true)
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                // Payment schedule
                SectionHeader(title: "Payment Schedule")
                    .padding(.horizontal, TerraSpacing.screenEdge)
                TerraCard {
                    VStack(spacing: 6) {
                        feeRow(label: "Deposit (charged now)", value: trip.depositAmount.asCurrency, bold: true)
                        feeRow(label: "Balance (after trip)", value: (trip.basePrice - trip.depositAmount).asCurrency, bold: false)
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                // Info callout
                infoCallout
                    .padding(.horizontal, TerraSpacing.screenEdge)

                // Error
                if let error {
                    Text(error.localizedDescription)
                        .font(.terraCaption)
                        .foregroundStyle(Color.terraDestructive)
                        .padding(.horizontal, TerraSpacing.screenEdge)
                }

                // PayPal button
                PayPalCheckoutButton(isLoading: isLoading) {
                    guard !isLoading else { return }
                    isLoading = true
                    Task { await authorize() }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                // Official PayPal Pay Later message (based on total trip cost)
                PayPalMessageBanner(amount: trip.basePrice, pageType: .checkout, logoType: .primary)
                    .frame(height: 44)
                    .padding(.horizontal, TerraSpacing.screenEdge)

                // Terms
                Text("Authorization valid for 29 days. By proceeding you agree to the booking terms.")
                    .font(.terraFootnote)
                    .foregroundStyle(Color.terraTextMuted)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, TerraSpacing.screenEdge)
                    .padding(.bottom, TerraSpacing.xxl)
            }
            .padding(.top, TerraSpacing.md)
        }
        .background(Color.terraAlpineOat)
        .navigationTitle("Checkout")
    }

    private func authorize() async {
        error = nil
        do {
            let orderService = OrderService()
            let order = try await orderService.createOrder(slug: trip.slug, intent: "AUTHORIZE")
            let result = try await orderService.authorizeOrder(id: order.id)
            onComplete(BookingResult(
                bookingReference: result.bookingReference,
                tripName: trip.name,
                paymentFlow: .authorize,
                totalAmount: trip.basePrice,
                paidAmount: trip.depositAmount,
                depositAmount: trip.depositAmount,
                captureId: result.captureId
            ))
        } catch let apiError as APIError {
            error = apiError
        } catch {
            self.error = .networkError(error.localizedDescription)
        }
        isLoading = false
    }

    private var orderSummary: some View {
        TerraCard {
            HStack(spacing: TerraSpacing.sm) {
                ZStack {
                    LinearGradient(colors: trip.gradientColors, startPoint: .topLeading, endPoint: .bottomTrailing)
                    if trip.hasImage {
                        Image(trip.imageName).resizable().aspectRatio(contentMode: .fill)
                    }
                }
                .frame(width: 48, height: 48)
                .clipShape(RoundedRectangle(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 2) {
                    Text(trip.name).font(.terraHeadline).foregroundStyle(Color.terraText)
                    Text("\(trip.durationLabel) / Guided Tour").font(.terraCaption).foregroundStyle(Color.terraTextMuted)
                }
                Spacer()
            }
        }
    }

    private var infoCallout: some View {
        HStack(alignment: .top, spacing: TerraSpacing.xs) {
            Image(systemName: "info.circle").foregroundStyle(Color(hex: "#3B82F6")).accessibilityHidden(true)
            Text("You're authorizing a \(trip.depositAmount.asCurrency) deposit. The remaining \((trip.basePrice - trip.depositAmount).asCurrency) will be charged after your trip is complete.")
                .font(.terraCaption)
                .foregroundStyle(Color(hex: "#1E40AF"))
        }
        .padding(TerraSpacing.sm)
        .background(Color(hex: "#EFF6FF"))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private func feeRow(label: String, value: String, bold: Bool) -> some View {
        HStack {
            Text(label).font(bold ? .terraHeadline : .terraBody).foregroundStyle(bold ? Color.terraText : Color.terraTextMuted)
            Spacer()
            Text(value).font(bold ? .terraHeadline : .terraBody).foregroundStyle(bold ? Color.terraMocha : Color.terraText)
        }
    }
}
