import SwiftUI

struct InfoRow: View {
    let label: String
    let value: String
    var icon: String? = nil

    var body: some View {
        HStack {
            HStack(spacing: 4) {
                if let icon {
                    Image(systemName: icon)
                        .font(.system(size: 12))
                        .foregroundStyle(Color.terraTextMuted)
                        .accessibilityHidden(true)
                }
                Text(label)
                    .font(.terraCaption)
                    .foregroundStyle(Color.terraTextMuted)
            }
            Spacer()
            Text(value)
                .font(.terraBody)
                .foregroundStyle(Color.terraText)
                .multilineTextAlignment(.trailing)
        }
        .padding(.vertical, 5)
    }
}

#Preview {
    VStack {
        InfoRow(label: "Vehicle", value: "Economy Sedan")
        InfoRow(label: "Pickup", value: "Apr 10, 2026", icon: "calendar")
        InfoRow(label: "Total Paid", value: "$162.00")
    }
    .padding()
}
