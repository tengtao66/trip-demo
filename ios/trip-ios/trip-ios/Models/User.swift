import Foundation

struct User: Codable, Identifiable, Equatable, Sendable {
    let id: String
    let name: String
    let email: String

    var avatarInitials: String {
        let parts = name.split(separator: " ")
        switch parts.count {
        case 0:
            return ""
        case 1:
            return String(parts[0].prefix(1)).uppercased()
        default:
            let first = String(parts[0].prefix(1))
            let last = String(parts[parts.count - 1].prefix(1))
            return (first + last).uppercased()
        }
    }
}

enum UserRole: String, Codable, Sendable, CaseIterable {
    case customer
    case merchant
}
