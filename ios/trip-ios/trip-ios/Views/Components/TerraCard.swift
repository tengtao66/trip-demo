import SwiftUI

struct TerraCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding(TerraSpacing.cardPadding)
            .background(Color.terraIvory)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .shadow(color: .black.opacity(0.06), radius: 4, y: 2)
    }
}

#Preview {
    VStack(spacing: 16) {
        TerraCard {
            Text("Sample Card")
                .font(.terraHeadline)
                .foregroundStyle(Color.terraText)
        }
        TerraCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("Tokyo Cherry Blossom")
                    .font(.terraHeadline)
                Text("5 Days / Guided Tour")
                    .font(.terraCaption)
                    .foregroundStyle(Color.terraTextMuted)
            }
        }
    }
    .padding()
    .background(Color.terraAlpineOat)
}
