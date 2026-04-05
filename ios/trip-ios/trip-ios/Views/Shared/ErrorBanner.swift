import SwiftUI
import UIKit

struct ErrorBanner: View {
    let message: String
    var retryAction: (() -> Void)? = nil
    @State private var isVisible = true

    var body: some View {
        if isVisible {
            HStack(spacing: TerraSpacing.xs) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(Color.terraDestructive)
                    .accessibilityHidden(true)
                Text(message)
                    .font(.terraCaption)
                    .foregroundStyle(Color.terraText)
                    .lineLimit(2)
                Spacer()
                if let retryAction {
                    Button("Retry") {
                        retryAction()
                    }
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(Color.terraTerracotta)
                }
                Button {
                    withAnimation { isVisible = false }
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(size: 10, weight: .bold))
                        .foregroundStyle(Color.terraTextMuted)
                }
                .accessibilityLabel("Dismiss error")
            }
            .padding(TerraSpacing.sm)
            .background(Color.terraDestructive.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.terraDestructive.opacity(0.2), lineWidth: 1))
            .transition(.move(edge: .top).combined(with: .opacity))
            .onAppear {
                UIAccessibility.post(notification: .announcement, argument: message)
                // Auto-dismiss after 8 seconds
                DispatchQueue.main.asyncAfter(deadline: .now() + 8) {
                    withAnimation { isVisible = false }
                }
            }
        }
    }
}

#Preview {
    VStack(spacing: 16) {
        ErrorBanner(message: "Network connection lost", retryAction: {})
        ErrorBanner(message: "Server error (500): Internal server error")
    }
    .padding()
}
