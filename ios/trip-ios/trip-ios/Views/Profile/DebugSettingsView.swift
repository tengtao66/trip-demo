#if DEBUG
import SwiftUI

struct DebugSettingsView: View {
    @Environment(AuthStore.self) private var authStore
    @State private var baseURLText: String = UserDefaults.standard.string(forKey: "terra_base_url") ?? "http://localhost:3001"

    var body: some View {
        List {
            Section("Server") {
                VStack(alignment: .leading, spacing: TerraSpacing.xs) {
                    Text("Base URL")
                        .font(.terraCaption)
                        .foregroundStyle(Color.terraTextMuted)
                    TextField("http://localhost:3001", text: $baseURLText)
                        .font(.terraBody)
                        .textFieldStyle(.roundedBorder)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.never)
                        .onSubmit {
                            UserDefaults.standard.set(baseURLText, forKey: "terra_base_url")
                        }
                }
                Button("Save & Apply") {
                    UserDefaults.standard.set(baseURLText, forKey: "terra_base_url")
                    HapticFeedback.success()
                }
                .font(.terraHeadline)
                .foregroundStyle(Color.terraTerracotta)
            }

            Section("Current Session") {
                InfoRow(label: "User", value: authStore.currentUser?.name ?? "Not logged in")
                InfoRow(label: "User ID", value: authStore.currentUser?.id ?? "-")
                InfoRow(label: "Role", value: authStore.role.rawValue)
                InfoRow(label: "Email", value: authStore.currentUser?.email ?? "-")
            }

            Section("Actions") {
                Button("Reset All Data") {
                    UserDefaults.standard.removeObject(forKey: "terra_base_url")
                    UserDefaults.standard.removeObject(forKey: "terra_auth_user")
                    UserDefaults.standard.removeObject(forKey: "terra_auth_role")
                    baseURLText = "http://localhost:3001"
                    authStore.logout()
                    HapticFeedback.impact()
                }
                .foregroundStyle(Color.terraDestructive)
            }

            Section("App Info") {
                InfoRow(label: "Version", value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0")
                InfoRow(label: "Build", value: Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1")
                InfoRow(label: "Swift", value: "6.0")
                InfoRow(label: "Target", value: "iOS 17+")
            }
        }
        .navigationTitle("Debug Settings")
    }
}

#Preview {
    NavigationStack {
        DebugSettingsView()
            .environment(AuthStore())
    }
}
#endif
