import SwiftUI

enum TerraButtonStyle {
    case primary
    case outline
    case destructive
    case ghost
}

struct TerraButton: View {
    let label: String
    var icon: String? = nil
    var style: TerraButtonStyle = .primary
    var isLoading: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: {
            guard !isLoading else { return }
            action()
        }) {
            HStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .tint(textColor)
                } else if let icon {
                    Image(systemName: icon)
                        .font(.system(size: 16, weight: .semibold))
                }
                Text(label)
                    .font(.terraHeadline)
            }
            .frame(maxWidth: .infinity, minHeight: 44)
            .foregroundStyle(textColor)
            .background(backgroundColor)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(borderColor, lineWidth: hasBorder ? 1.5 : 0)
            )
            .opacity(isLoading ? 0.7 : 1.0)
        }
        .disabled(isLoading)
    }

    private var textColor: Color {
        switch style {
        case .primary: .white
        case .outline: .terraTerracotta
        case .destructive: .terraDestructive
        case .ghost: .terraTextMuted
        }
    }

    private var backgroundColor: Color {
        switch style {
        case .primary: .terraTerracotta
        case .outline, .destructive, .ghost: .clear
        }
    }

    private var borderColor: Color {
        switch style {
        case .outline: .terraTerracotta
        case .destructive: .terraDestructive
        default: .clear
        }
    }

    private var hasBorder: Bool {
        style == .outline || style == .destructive
    }
}

#Preview {
    VStack(spacing: 12) {
        TerraButton(label: "Reserve with Deposit", icon: "lock", action: {})
        TerraButton(label: "View Details", style: .outline, action: {})
        TerraButton(label: "Issue Refund", icon: "arrow.counterclockwise", style: .destructive, action: {})
        TerraButton(label: "Cancel", style: .ghost, action: {})
        TerraButton(label: "Processing...", isLoading: true, action: {})
    }
    .padding()
    .background(Color.terraAlpineOat)
}
