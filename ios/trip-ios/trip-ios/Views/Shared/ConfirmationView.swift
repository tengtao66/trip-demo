import SwiftUI

struct BookingResult: Sendable {
    let bookingReference: String
    let tripName: String
    let paymentFlow: PaymentFlow
    let totalAmount: Double
    let paidAmount: Double
    let depositAmount: Double?
    let captureId: String?
}

struct ConfirmationView: View {
    let result: BookingResult
    let onViewBookings: () -> Void
    let onBackToHome: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: TerraSpacing.xl) {
                Spacer(minLength: TerraSpacing.xxl)

                // Checkmark
                Image(systemName: "checkmark")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(.white)
                    .frame(width: 56, height: 56)
                    .background(Color.terraSage)
                    .clipShape(Circle())
                    .accessibilityHidden(true)

                // Title
                Text(titleText)
                    .font(.terraLargeTitle)
                    .foregroundStyle(Color.terraMocha)
                    .multilineTextAlignment(.center)

                Text("Booking ref: \(result.bookingReference)")
                    .font(.terraCaption)
                    .foregroundStyle(Color.terraTextMuted)

                // Step indicator for authorize flow
                if result.paymentFlow == .authorize {
                    stepIndicator
                }

                // Details card
                TerraCard {
                    VStack(spacing: TerraSpacing.xs) {
                        InfoRow(label: "Trip", value: result.tripName)
                        if let deposit = result.depositAmount, deposit > 0 {
                            InfoRow(label: "Deposit Paid", value: deposit.asCurrency)
                            InfoRow(label: "Balance Remaining", value: (result.totalAmount - deposit).asCurrency)
                        } else {
                            InfoRow(label: "Total Paid", value: result.paidAmount.asCurrency)
                        }
                        if let captureId = result.captureId {
                            InfoRow(label: "PayPal Txn ID", value: captureId)
                        }
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                // Flow-specific message
                if result.paymentFlow == .authorize {
                    infoCallout(text: "Your deposit has been authorized and captured. The remaining balance will be collected after trip completion.")
                } else if result.paymentFlow == .vault {
                    infoCallout(text: "Your setup fee has been paid. The merchant can charge add-ons during your trip and will settle the final amount afterward.")
                } else if result.paymentFlow == .invoice {
                    infoCallout(text: "Your trip request has been submitted. An invoice will be sent to your email for payment.")
                }

                // CTAs
                VStack(spacing: TerraSpacing.sm) {
                    TerraButton(label: "View My Bookings", icon: "calendar") {
                        onViewBookings()
                    }
                    TerraButton(label: "Back to Home", style: .ghost) {
                        onBackToHome()
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                Spacer(minLength: TerraSpacing.xxxl)
            }
        }
        .background(Color.terraAlpineOat)
        .navigationBarBackButtonHidden()
    }

    private var titleText: String {
        switch result.paymentFlow {
        case .authorize: "Deposit Authorized!"
        case .vault: "Setup Fee Paid!"
        case .invoice: "Request Submitted!"
        case .instant: "Booking Confirmed!"
        }
    }

    private var stepIndicator: some View {
        HStack(spacing: TerraSpacing.xs) {
            Circle().fill(Color.terraSage).frame(width: 8, height: 8)
            RoundedRectangle(cornerRadius: 1).fill(Color.terraSage).frame(width: 32, height: 2)
            Circle().fill(Color.terraBorder).frame(width: 8, height: 8)
        }
        .accessibilityLabel("Step 1 of 2 complete")
    }

    private func infoCallout(text: String) -> some View {
        HStack(alignment: .top, spacing: TerraSpacing.xs) {
            Image(systemName: "info.circle")
                .foregroundStyle(Color(hex: "#3B82F6"))
                .accessibilityHidden(true)
            Text(text)
                .font(.terraCaption)
                .foregroundStyle(Color(hex: "#1E40AF"))
        }
        .padding(TerraSpacing.sm)
        .background(Color(hex: "#EFF6FF"))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .padding(.horizontal, TerraSpacing.screenEdge)
    }
}
