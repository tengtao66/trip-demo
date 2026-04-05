import SwiftUI
import PaymentButtons

enum PayLaterStyle {
    case full   // Official Pay Later button + installment text (Flow 4)
    case link   // Text link only (Flow 1)
}

struct PayLaterMessage: View {
    let total: Double
    var style: PayLaterStyle = .full

    private var installmentAmount: Double {
        PayLaterCalculator.installmentAmount(total: total)
    }

    var body: some View {
        switch style {
        case .full:
            VStack(spacing: TerraSpacing.xs) {
                PayPalPayLaterCheckoutButton {}
                Text("Pay in 4 interest-free payments of \(installmentAmount.asCurrency)")
                    .font(.terraCaption)
                    .foregroundStyle(Color.terraTextMuted)
                    .multilineTextAlignment(.center)
            }

        case .link:
            PayPalPayLaterButton.Representable(
                color: .white,
                edges: .softEdges,
                size: .mini
            )
            .frame(height: 36)
        }
    }
}

#Preview {
    VStack(spacing: 24) {
        PayLaterMessage(total: 162.0, style: .full)
        PayLaterMessage(total: 800.0, style: .link)
    }
    .padding()
    .background(Color.terraAlpineOat)
}
