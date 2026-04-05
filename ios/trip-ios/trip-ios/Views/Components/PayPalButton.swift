import SwiftUI
import PaymentButtons

struct PayPalCheckoutButton: View {
    var isLoading: Bool = false
    let action: () -> Void

    var body: some View {
        if isLoading {
            ProgressView()
                .frame(maxWidth: .infinity, minHeight: 50)
                .background(Color(hex: "#FFC439"))
                .clipShape(RoundedRectangle(cornerRadius: 24))
                .accessibilityLabel("Processing payment")
        } else {
            PayPalButton.Representable(
                color: .gold,
                edges: .softEdges,
                size: .expanded,
                label: .payWith,
                action
            )
            .frame(height: 50)
            .accessibilityLabel("Pay with PayPal")
        }
    }
}

struct PayPalPayLaterCheckoutButton: View {
    let action: () -> Void

    var body: some View {
        PayPalPayLaterButton.Representable(
            color: .gold,
            edges: .softEdges,
            size: .expanded,
            action
        )
        .frame(height: 50)
        .accessibilityLabel("Pay Later with PayPal")
    }
}

#Preview {
    VStack(spacing: 16) {
        PayPalCheckoutButton(action: {})
        PayPalCheckoutButton(isLoading: true, action: {})
        PayPalPayLaterCheckoutButton(action: {})
    }
    .padding()
    .background(Color.terraAlpineOat)
}
