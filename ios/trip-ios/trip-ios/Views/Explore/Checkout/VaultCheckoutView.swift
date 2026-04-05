import SwiftUI

struct VaultCheckoutView: View {
    let trip: Trip
    let onComplete: (BookingResult) -> Void
    @State private var isLoading = false
    @State private var error: APIError?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: TerraSpacing.md) {
                // Order summary
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
                            Text("Setup fee: \(trip.depositAmount.asCurrency)").font(.terraCaption).foregroundStyle(Color.terraTextMuted)
                        }
                        Spacer()
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                // How It Works
                SectionHeader(title: "How It Works")
                    .padding(.horizontal, TerraSpacing.screenEdge)
                TerraCard {
                    VStack(alignment: .leading, spacing: TerraSpacing.sm) {
                        stepRow(number: 1, text: "Pay setup fee now")
                        stepRow(number: 2, text: "Merchant charges add-ons during your trip")
                        stepRow(number: 3, text: "Final settlement after trip completion")
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                // Package breakdown
                SectionHeader(title: "Package Includes")
                    .padding(.horizontal, TerraSpacing.screenEdge)
                TerraCard {
                    VStack(spacing: 6) {
                        ForEach(trip.feeBreakdown, id: \.item) { item, amount in
                            feeRow(item, amount.asCurrency, bold: false)
                        }
                        Divider().padding(.vertical, 4)
                        feeRow("Subtotal", trip.basePrice.asCurrency, bold: true)
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                // Payment schedule
                TerraCard {
                    VStack(spacing: 6) {
                        feeRow("Setup fee (charged now)", trip.depositAmount.asCurrency, bold: true)
                        feeRow("Add-ons during trip", "Varies", bold: false)
                        feeRow("Final settlement", "After trip", bold: false)
                    }
                }
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
                    Task { await pay() }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                Text("Your payment method will be saved for future charges.")
                    .font(.terraFootnote)
                    .foregroundStyle(Color.terraTextMuted)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
                    .padding(.bottom, TerraSpacing.xxl)
            }
            .padding(.top, TerraSpacing.md)
        }
        .background(Color.terraAlpineOat)
        .navigationTitle("Checkout")
    }

    private func pay() async {
        error = nil
        do {
            let orderService = OrderService()
            let order = try await orderService.createOrder(slug: trip.slug, intent: "CAPTURE")
            let result = try await orderService.captureOrder(id: order.id)
            onComplete(BookingResult(
                bookingReference: result.bookingReference,
                tripName: trip.name,
                paymentFlow: .vault,
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

    private func stepRow(number: Int, text: String) -> some View {
        HStack(spacing: TerraSpacing.sm) {
            Text("\(number)")
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(.white)
                .frame(width: 24, height: 24)
                .background(Color.terraTerracotta)
                .clipShape(Circle())
            Text(text)
                .font(.terraBody)
                .foregroundStyle(Color.terraText)
        }
    }

    private func feeRow(_ label: String, _ value: String, bold: Bool) -> some View {
        HStack {
            Text(label).font(bold ? .terraHeadline : .terraBody).foregroundStyle(bold ? Color.terraText : Color.terraTextMuted)
            Spacer()
            Text(value).font(bold ? .terraHeadline : .terraBody).foregroundStyle(bold ? Color.terraMocha : Color.terraText)
        }
    }
}
