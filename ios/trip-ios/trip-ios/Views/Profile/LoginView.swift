import SwiftUI

struct LoginView: View {
    @Environment(AuthStore.self) private var authStore

    @State private var selectedUserIndex = 0

    private let preseededUsers: [User] = [
        User(id: "u1", name: "John Doe", email: "john.doe@email.com"),
        User(id: "u2", name: "Sarah Johnson", email: "sarah.johnson@email.com"),
        User(id: "u3", name: "Mike Chen", email: "mike.chen@email.com"),
    ]

    var body: some View {
        VStack(spacing: TerraSpacing.xxl) {
            Spacer()

            // Branding
            VStack(spacing: TerraSpacing.xs) {
                Image(systemName: "globe.americas.fill")
                    .font(.system(size: 48))
                    .foregroundStyle(Color.terraTerracotta)
                    .accessibilityHidden(true)
                Text("TERRA")
                    .font(.terraLargeTitle)
                    .foregroundStyle(Color.terraMocha)
                Text("Trip Booking Demo")
                    .font(.terraCaption)
                    .foregroundStyle(Color.terraTextMuted)
            }

            // User picker
            TerraCard {
                VStack(alignment: .leading, spacing: TerraSpacing.md) {
                    Text("Select User")
                        .font(.terraHeadline)
                        .foregroundStyle(Color.terraText)

                    Picker("User", selection: $selectedUserIndex) {
                        ForEach(Array(preseededUsers.enumerated()), id: \.offset) { index, user in
                            Text(user.name).tag(index)
                        }
                    }
                    .pickerStyle(.wheel)
                    .frame(height: 120)
                }
            }
            .padding(.horizontal, TerraSpacing.screenEdge)

            // Login buttons
            VStack(spacing: TerraSpacing.sm) {
                TerraButton(label: "Login as Customer", icon: "person") {
                    authStore.login(user: preseededUsers[selectedUserIndex], role: .customer)
                }
                TerraButton(label: "Login as Merchant", icon: "building.2", style: .outline) {
                    authStore.login(user: preseededUsers[selectedUserIndex], role: .merchant)
                }
            }
            .padding(.horizontal, TerraSpacing.screenEdge)

            Spacer()
            Spacer()
        }
        .background(Color.terraAlpineOat)
    }
}

#Preview {
    LoginView()
        .environment(AuthStore())
}
