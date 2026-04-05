import SwiftUI
import PayPalMessages

struct InstantCheckoutView: View {
    let trip: Trip
    let onComplete: (BookingResult) -> Void
    @State private var isLoading = false
    @State private var error: APIError?

    // Car rental: receive dates from detail view, or default to 3 days
    var pickupDate: Date = Date()
    var dropoffDate: Date = Calendar.current.date(byAdding: .day, value: 3, to: Date()) ?? Date()

    // Computed pricing
    private var rentalDays: Int {
        guard trip.category == .carRental else { return trip.durationDays }
        return max(Calendar.current.dateComponents([.day], from: pickupDate, to: dropoffDate).day ?? 1, 1)
    }

    private var subtotal: Double {
        if trip.category == .carRental, let rate = trip.dailyRate {
            return rate * Double(rentalDays)
        }
        return trip.basePrice
    }

    private var tax: Double { subtotal * 0.08 }
    private var total: Double { subtotal + tax }

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
                        .frame(width: 60, height: 60)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(trip.name).font(.terraHeadline).foregroundStyle(Color.terraText)
                            if trip.category == .carRental {
                                Text("\(rentalDays) day\(rentalDays == 1 ? "" : "s") rental")
                                    .font(.terraCaption).foregroundStyle(Color.terraTextMuted)
                            } else {
                                Text("\(trip.durationLabel) Cruise")
                                    .font(.terraCaption).foregroundStyle(Color.terraTextMuted)
                            }
                        }
                        Spacer()
                        Text(total.asCurrency)
                            .font(.terraTitle)
                            .foregroundStyle(Color.terraMocha)
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                // Price breakdown
                TerraCard {
                    VStack(spacing: 6) {
                        if trip.category == .carRental, let rate = trip.dailyRate {
                            feeRow("\(rentalDays) days x \(rate.asCurrency)/day", subtotal.asCurrency, bold: false)
                        } else {
                            feeRow(trip.name, subtotal.asCurrency, bold: false)
                        }
                        feeRow("Tax & fees", tax.asCurrency, bold: false)
                        Divider().padding(.vertical, 4)
                        feeRow("Total", total.asCurrency, bold: true)
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
                    Task { await capture() }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                // Official PayPal Pay Later button
                PayPalPayLaterCheckoutButton {}
                    .padding(.horizontal, TerraSpacing.screenEdge)

                // Official PayPal Pay Later message
                PayPalMessageBanner(amount: total, pageType: .checkout)
                    .frame(height: 44)
                    .padding(.horizontal, TerraSpacing.screenEdge)

                // Secure badge
                HStack(spacing: 6) {
                    Image(systemName: "lock.fill")
                        .font(.system(size: 12))
                        .accessibilityHidden(true)
                    Text("Secure checkout powered by PayPal")
                        .font(.terraFootnote)
                }
                .foregroundStyle(Color.terraTextMuted)
                .frame(maxWidth: .infinity)
                .padding(.bottom, TerraSpacing.xxl)
            }
            .padding(.top, TerraSpacing.md)
        }
        .background(Color.terraAlpineOat)
        .navigationTitle("Checkout")
    }

    private func capture() async {
        error = nil
        do {
            let orderService = OrderService()
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"

            let order = try await orderService.createOrder(
                slug: trip.slug,
                intent: "CAPTURE",
                pickupDate: trip.category == .carRental ? formatter.string(from: pickupDate) : nil,
                dropoffDate: trip.category == .carRental ? formatter.string(from: dropoffDate) : nil
            )
            let result = try await orderService.captureOrder(id: order.id)
            onComplete(BookingResult(
                bookingReference: result.bookingReference,
                tripName: trip.name,
                paymentFlow: .instant,
                totalAmount: total,
                paidAmount: total,
                depositAmount: nil,
                captureId: result.captureId
            ))
        } catch let apiError as APIError {
            error = apiError
        } catch {
            self.error = .networkError(error.localizedDescription)
        }
        isLoading = false
    }

    private func feeRow(_ label: String, _ value: String, bold: Bool) -> some View {
        HStack {
            Text(label).font(bold ? .terraHeadline : .terraBody).foregroundStyle(bold ? Color.terraText : Color.terraTextMuted)
            Spacer()
            Text(value).font(bold ? .terraHeadline : .terraBody).foregroundStyle(bold ? Color.terraMocha : Color.terraText)
        }
    }
}
