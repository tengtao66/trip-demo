import SwiftUI

struct ProcessingOverlay: View {
    let message: String
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        ZStack {
            Color.black.opacity(0.5)
                .ignoresSafeArea()

            VStack(spacing: TerraSpacing.md) {
                ProgressView()
                    .controlSize(.large)
                    .tint(Color.terraTerracotta)
                Text(message)
                    .font(.terraHeadline)
                    .foregroundStyle(Color.terraText)
                Text("Please don't close this screen")
                    .font(.terraCaption)
                    .foregroundStyle(Color.terraTextMuted)
            }
            .padding(TerraSpacing.xxl)
            .background(Color.terraIvory)
            .clipShape(RoundedRectangle(cornerRadius: 20))
            .shadow(color: .black.opacity(0.2), radius: 16, y: 8)
        }
        .transition(reduceMotion ? .opacity : .opacity.combined(with: .scale(scale: 0.95)))
        .animation(reduceMotion ? .none : .spring(response: 0.35, dampingFraction: 0.85), value: true)
        .interactiveDismissDisabled()
        .accessibilityLabel(message)
    }
}

#Preview {
    ZStack {
        Color.terraAlpineOat.ignoresSafeArea()
        Text("Content behind overlay")
        ProcessingOverlay(message: "Processing Payment...")
    }
}
