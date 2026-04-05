import SwiftUI

struct TimelineStep: Identifiable {
    let id = UUID()
    let title: String
    let subtitle: String
    let isDone: Bool
}

struct PaymentTimeline: View {
    let steps: [TimelineStep]

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(Array(steps.enumerated()), id: \.element.id) { index, step in
                HStack(alignment: .top, spacing: TerraSpacing.sm) {
                    // Dot + line
                    VStack(spacing: 0) {
                        Circle()
                            .fill(step.isDone ? Color.terraSage : Color.terraBorder)
                            .frame(width: 20, height: 20)
                            .overlay {
                                if step.isDone {
                                    Image(systemName: "checkmark")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(.white)
                                }
                            }
                        if index < steps.count - 1 {
                            Rectangle()
                                .fill(Color.terraBorder)
                                .frame(width: 2, height: 24)
                        }
                    }

                    // Text
                    VStack(alignment: .leading, spacing: 2) {
                        Text(step.title)
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Color.terraText)
                        Text(step.subtitle)
                            .font(.terraCaption)
                            .foregroundStyle(Color.terraTextMuted)
                    }
                    .padding(.bottom, index < steps.count - 1 ? TerraSpacing.sm : 0)

                    Spacer()
                }
            }
        }
        .accessibilityElement(children: .combine)
    }

    // MARK: - Factory methods for each flow

    static func forAuthorize(booking: BookingDetail) -> [TimelineStep] {
        var steps: [TimelineStep] = []
        let depositDone = booking.charges.contains { $0.type == "deposit" && $0.status == "completed" }
        let balanceDone = booking.charges.contains { $0.type == "balance" && $0.status == "completed" }

        steps.append(TimelineStep(title: "Deposit authorized & captured", subtitle: booking.charges.first { $0.type == "deposit" }?.amount.asCurrency ?? "", isDone: depositDone))
        steps.append(TimelineStep(title: "Balance due", subtitle: depositDone && !balanceDone ? "After trip completion" : (booking.charges.first { $0.type == "balance" }?.amount.asCurrency ?? ""), isDone: balanceDone))
        return steps
    }

    static func forVault(booking: BookingDetail) -> [TimelineStep] {
        var steps: [TimelineStep] = []
        let setupDone = booking.charges.contains { $0.type == "setup_fee" && $0.status == "completed" }
        steps.append(TimelineStep(title: "Setup fee", subtitle: booking.charges.first { $0.type == "setup_fee" }?.amount.asCurrency ?? "", isDone: setupDone))
        for charge in booking.charges where charge.type == "addon" {
            steps.append(TimelineStep(title: charge.description, subtitle: charge.amount.asCurrency, isDone: charge.status == "completed"))
        }
        let finalDone = booking.charges.contains { $0.type == "final" && $0.status == "completed" }
        steps.append(TimelineStep(title: "Final settlement", subtitle: finalDone ? "Completed" : "Pending", isDone: finalDone))
        return steps
    }

    static func forInvoice(booking: BookingDetail) -> [TimelineStep] {
        let invoicePaid = booking.status.lowercased().contains("paid")
        return [
            TimelineStep(title: "Request submitted", subtitle: booking.createdAt.asDate?.formatted_MMMddyyyy ?? "", isDone: true),
            TimelineStep(title: "Invoice sent", subtitle: booking.invoiceId ?? "", isDone: booking.invoiceId != nil),
            TimelineStep(title: "Invoice paid", subtitle: invoicePaid ? "Completed" : "Awaiting payment", isDone: invoicePaid),
        ]
    }

    static func forInstant(booking: BookingDetail) -> [TimelineStep] {
        let captured = booking.charges.contains { $0.type == "full_payment" && $0.status == "completed" }
        return [
            TimelineStep(title: "Full payment captured", subtitle: booking.paidAmount.asCurrency, isDone: captured),
        ]
    }
}
