import SwiftUI

struct ProfileView: View {
    @Environment(AuthStore.self) private var authStore

    var body: some View {
        if authStore.isLoggedIn {
            loggedInView
        } else {
            LoginView()
        }
    }

    private var loggedInView: some View {
        @Bindable var authStore = authStore

        return ScrollView {
            VStack(spacing: TerraSpacing.xl) {
                // Avatar + Info
                VStack(spacing: TerraSpacing.sm) {
                    // Initials circle
                    Text(authStore.currentUser?.avatarInitials ?? "")
                        .font(.terraTitle)
                        .foregroundStyle(.white)
                        .frame(width: 72, height: 72)
                        .background(Color.terraTerracotta)
                        .clipShape(Circle())
                        .accessibilityLabel("Avatar for \(authStore.currentUser?.name ?? "user")")

                    Text(authStore.currentUser?.name ?? "")
                        .font(.terraTitle)
                        .foregroundStyle(Color.terraText)

                    Text(authStore.currentUser?.email ?? "")
                        .font(.terraCaption)
                        .foregroundStyle(Color.terraTextMuted)
                }
                .padding(.top, TerraSpacing.xl)

                // Role switcher
                TerraCard {
                    VStack(alignment: .leading, spacing: TerraSpacing.sm) {
                        Text("Role")
                            .font(.terraHeadline)
                            .foregroundStyle(Color.terraText)

                        Picker("Role", selection: Binding(
                            get: { authStore.role },
                            set: { authStore.switchRole($0) }
                        )) {
                            Text("Customer").tag(UserRole.customer)
                            Text("Merchant").tag(UserRole.merchant)
                        }
                        .pickerStyle(.segmented)
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                // Debug settings (in DEBUG builds)
                #if DEBUG
                NavigationLink {
                    DebugSettingsView()
                } label: {
                    TerraCard {
                        HStack {
                            Image(systemName: "wrench.and.screwdriver")
                                .foregroundStyle(Color.terraTerracotta)
                            Text("Debug Settings")
                                .font(.terraHeadline)
                                .foregroundStyle(Color.terraText)
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.system(size: 12))
                                .foregroundStyle(Color.terraTextMuted)
                        }
                    }
                }
                .padding(.horizontal, TerraSpacing.screenEdge)
                #endif

                // Logout
                TerraButton(label: "Logout", icon: "rectangle.portrait.and.arrow.right", style: .destructive) {
                    authStore.logout()
                }
                .padding(.horizontal, TerraSpacing.screenEdge)

                Spacer(minLength: TerraSpacing.xxxl)
            }
        }
        .background(Color.terraAlpineOat)
    }
}

#Preview("Logged In") {
    let store = AuthStore()
    store.login(user: User(id: "u1", name: "John Doe", email: "john@test.com"), role: .customer)
    return ProfileView()
        .environment(store)
}

#Preview("Logged Out") {
    ProfileView()
        .environment(AuthStore())
}
