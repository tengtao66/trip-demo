import Foundation

enum BookingCalculator {
    static func progressRatio(paid: Double, total: Double) -> Double {
        guard total > 0 else { return 0.0 }
        return paid / total
    }

    static func captureAmount(total: Double, deposit: Double) -> Double {
        max(total - deposit, 0)
    }

    static func daysRemaining(expiresAt: Date, now: Date = Date()) -> Int {
        let calendar = Calendar.current
        let components = calendar.dateComponents([.day], from: now, to: expiresAt)
        return components.day ?? 0
    }
}

enum PayLaterCalculator {
    static func installmentAmount(total: Double) -> Double {
        guard total > 0 else { return 0.0 }
        return (total / 4.0 * 100).rounded() / 100
    }
}

enum ChargeAddonValidator {
    static func parseAmount(_ text: String) -> Double? {
        guard let value = Double(text), value > 0 else { return nil }
        return value
    }
}

struct ChargeAddonPreset: Sendable {
    let name: String
    let amount: Double
}
