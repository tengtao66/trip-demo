import SwiftUI

struct StatusBadge: View {
    let status: String

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: iconName)
                .font(.system(size: 10, weight: .bold))
            Text(displayText)
                .font(.system(size: 11, weight: .semibold))
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 4)
        .foregroundStyle(textColor)
        .background(backgroundColor)
        .clipShape(Capsule())
        .accessibilityLabel(displayText)
    }

    private var displayText: String {
        status.replacingOccurrences(of: "_", with: " ").capitalized
    }

    private var iconName: String {
        switch status.lowercased() {
        case "completed", "captured", "fully_paid", "confirmed":
            "checkmark"
        case "pending", "authorized", "deposit_captured", "deposit_paid":
            "clock"
        case "active", "processing", "invoice_sent":
            "circle.fill"
        case "merchant":
            "building.2"
        case "failed", "voided":
            "xmark"
        default:
            "circle"
        }
    }

    private var textColor: Color {
        switch status.lowercased() {
        case "completed", "captured", "fully_paid", "confirmed":
            .terraSageText
        case "pending", "authorized", "deposit_captured", "deposit_paid":
            .terraWarningText
        case "active", "processing", "invoice_sent":
            Color(hex: "#1E40AF")
        case "merchant":
            Color(hex: "#7C3AED")
        case "failed", "voided":
            .terraDestructive
        default:
            .terraTextMuted
        }
    }

    private var backgroundColor: Color {
        switch status.lowercased() {
        case "completed", "captured", "fully_paid", "confirmed":
            Color.terraSage.opacity(0.15)
        case "pending", "authorized", "deposit_captured", "deposit_paid":
            Color.terraWarning.opacity(0.12)
        case "active", "processing", "invoice_sent":
            Color(hex: "#3B82F6").opacity(0.1)
        case "merchant":
            Color(hex: "#7C3AED").opacity(0.1)
        case "failed", "voided":
            Color.terraDestructive.opacity(0.1)
        default:
            Color.terraBorder
        }
    }
}

#Preview {
    VStack(spacing: 8) {
        StatusBadge(status: "completed")
        StatusBadge(status: "deposit_captured")
        StatusBadge(status: "processing")
        StatusBadge(status: "merchant")
        StatusBadge(status: "failed")
    }
    .padding()
    .background(Color.terraAlpineOat)
}
