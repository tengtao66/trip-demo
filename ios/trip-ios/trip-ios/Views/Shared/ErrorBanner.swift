import SwiftUI
import UIKit

struct ErrorBanner: View {
    let message: String
    var retryAction: (() -> Void)? = nil
    @Binding var isPresented: Bool

    var body: some View {
        if isPresented {
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
                    .font(.system(.caption, weight: .semibold))
                    .foregroundStyle(Color.terraTerracotta)
                }
                Button {
                    withAnimation { isPresented = false }
                } label: {
                    Image(systemName: "xmark")
                        .font(.system(.caption2, weight: .bold))
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
            }
            .task {
                try? await Task.sleep(for: .seconds(8))
                withAnimation { isPresented = false }
            }
        }
    }
}

#Preview {
    @Previewable @State var show1 = true
    @Previewable @State var show2 = true
    VStack(spacing: 16) {
        ErrorBanner(message: "Network connection lost", retryAction: {}, isPresented: $show1)
        ErrorBanner(message: "Server error (500)", isPresented: $show2)
    }
    .padding()
}
