import SwiftUI
import PayPalMessages

/// Official PayPal Pay Later message banner showing "Pay in 4" or "Pay monthly" messaging.
/// Requires a valid PayPal client ID and amount to display contextual messaging.
struct PayPalMessageBanner: UIViewRepresentable {
    let amount: Double
    var pageType: PayPalMessagePageType = .productDetails
    var logoType: PayPalMessageLogoType = .inline
    var color: PayPalMessageColor = .black
    var textAlign: PayPalMessageTextAlign = .center

    // PayPal sandbox client ID
    private let clientID = "Ae-tqueTE1mGPQDjxR07SAE-JlgGLZqylMa92nYuxVQLOwwnII7DYIoOAcVjW9rWtmiUFsHP4K9GfU9z"

    func makeUIView(context: Context) -> PayPalMessageView {
        let data = PayPalMessageData(
            clientID: clientID,
            environment: .sandbox,
            amount: amount,
            pageType: pageType,
            offerType: .payLaterShortTerm
        )
        let style = PayPalMessageStyle(
            logoType: logoType,
            color: color,
            textAlign: textAlign
        )
        let config = PayPalMessageConfig(data: data, style: style)
        return PayPalMessageView(config: config)
    }

    func updateUIView(_ view: PayPalMessageView, context: Context) {
        view.amount = amount
    }
}

#Preview {
    VStack(spacing: 20) {
        PayPalMessageBanner(amount: 162.0)
            .frame(height: 44)
        PayPalMessageBanner(amount: 800.0, pageType: .checkout, logoType: .primary)
            .frame(height: 44)
    }
    .padding()
}
