import SwiftUI

struct EmptyStateView: View {
    let icon: String
    let title: String
    let subtitle: String
    var actionLabel: String? = nil
    var action: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: TerraSpacing.md) {
            Spacer(minLength: 80)
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundStyle(Color.terraTerracotta.opacity(0.3))
                .accessibilityHidden(true)
            Text(title)
                .font(.terraTitle)
                .foregroundStyle(Color.terraTextMuted)
            Text(subtitle)
                .font(.terraCaption)
                .foregroundStyle(Color.terraTextMuted.opacity(0.7))
                .multilineTextAlignment(.center)
            if let actionLabel, let action {
                TerraButton(label: actionLabel, style: .outline, action: action)
                    .padding(.horizontal, TerraSpacing.xxxl)
            }
            Spacer()
        }
        .frame(maxWidth: .infinity)
    }
}
