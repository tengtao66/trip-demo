import SwiftUI

struct SectionHeader: View {
    let title: String

    var body: some View {
        Text(title)
            .font(.terraTitle)
            .foregroundStyle(Color.terraText)
            .padding(.top, TerraSpacing.sectionSpacing)
            .padding(.bottom, TerraSpacing.xs)
    }
}

#Preview {
    VStack(alignment: .leading) {
        SectionHeader(title: "Day-by-Day Itinerary")
        SectionHeader(title: "Payment Details")
    }
    .padding()
}
